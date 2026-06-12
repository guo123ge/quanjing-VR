import { promises as fs } from "fs";
import path from "path";
import { DetectionStatus, FloorplanFileType, RoomType, WorkflowStatus } from "@prisma/client";
import { createCanvas } from "@napi-rs/canvas";
import sharp from "sharp";
import { prisma } from "./db";
import { makeId, publicUploadPath, uploadDir } from "./paths";
import { requirementFor } from "./requirements";
import type { DetectedRoomInput } from "./types";

const roomNameMap: Array<[RegExp, RoomType]> = [
  [/客厅|起居|餐厅|客餐厅|living|dining/i, RoomType.LIVING_DINING],
  [/主卧|卧室|次卧|老人房|儿童房|bed/i, RoomType.BEDROOM],
  [/厨房|kitchen/i, RoomType.KITCHEN],
  [/卫生间|洗手间|主卫|客卫|bath|toilet|wc/i, RoomType.BATHROOM],
  [/书房|study/i, RoomType.STUDY],
  [/阳台|balcony/i, RoomType.BALCONY],
  [/储藏|衣帽|storage|closet/i, RoomType.STORAGE],
  [/玄关|门厅|entry|foyer/i, RoomType.ENTRY],
];

export function detectFileType(file: File) {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/.test(name)) return FloorplanFileType.IMAGE;
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return FloorplanFileType.PDF;
  if (name.endsWith(".dxf")) return FloorplanFileType.DXF;
  if (name.endsWith(".dwg")) {
    throw new Error("暂不支持 DWG，请先在 CAD 软件中另存为 DXF 后上传。");
  }
  throw new Error("不支持的文件格式，请上传 JPG、PNG、WebP、PDF 或 DXF。");
}

export async function saveUploadedFile(file: File, purpose: "floorplan" | "reference" | "generated" = "floorplan") {
  await fs.mkdir(uploadDir, { recursive: true });
  const ext = extensionFromFile(file);
  const fileName = `${makeId(purpose)}${ext}`;
  const filePath = path.join(uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return {
    buffer,
    fileName,
    filePath,
    fileUrl: publicUploadPath(fileName),
    size: buffer.length,
  };
}

export async function ingestFloorplan(projectId: string, file: File) {
  const fileType = detectFileType(file);
  const requirement = requirementFor(fileType);
  const maxBytes = requirement.maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`${requirement.title} 文件不能超过 ${requirement.maxSizeMb}MB。`);
  }

  const saved = await saveUploadedFile(file, "floorplan");
  let previewUrl: string | null = null;
  let width: number | null = null;
  let height: number | null = null;
  let pageCount: number | null = null;
  let rooms: DetectedRoomInput[] = [];
  let status: DetectionStatus = DetectionStatus.SUCCEEDED;
  let errorMessage: string | null = null;

  try {
    if (fileType === FloorplanFileType.IMAGE) {
      const image = sharp(saved.buffer, { failOn: "none" });
      const meta = await image.metadata();
      width = meta.width ?? null;
      height = meta.height ?? null;
      if (!width || !height) throw new Error("无法读取图片尺寸，请上传 JPG、PNG 或 WebP 户型图。");
      if (width < 1200 || height < 900) {
        throw new Error("图片像素过低，建议不低于 2000 x 1500，推荐长边 3000 像素以上。");
      }
      previewUrl = await createImagePreview(saved.buffer, "floorplan-preview", 1800);
      rooms = inferRoomsFromName(file.name);
    } else if (fileType === FloorplanFileType.PDF) {
      if (saved.buffer.subarray(0, 4).toString() !== "%PDF") {
        throw new Error("PDF 文件头不合法，请重新导出无加密 PDF。");
      }
      pageCount = estimatePdfPageCount(saved.buffer);
      const pdfPreview = await renderPdfFirstPage(saved.buffer);
      previewUrl = pdfPreview.previewUrl;
      width = pdfPreview.width;
      height = pdfPreview.height;
      rooms = inferRoomsFromName(file.name);
    } else {
      previewUrl = null;
      rooms = detectRoomsFromDxf(saved.buffer.toString("utf8"));
    }

    if (rooms.length === 0) {
      throw new Error("未能识别到明确房间名称。");
    }
  } catch (error) {
    status = DetectionStatus.FAILED;
    errorMessage = error instanceof Error ? error.message : "户型识别失败。";
  }

  const suggestions = status === DetectionStatus.FAILED ? requirement.failureTips : [];
  const asset = await prisma.floorplanAsset.create({
    data: {
      projectId,
      fileType,
      originalName: file.name,
      fileUrl: saved.fileUrl,
      previewUrl,
      size: saved.size,
      width,
      height,
      pageCount,
      selectedPage: pageCount ? 1 : null,
      status,
      errorMessage,
      suggestionsJson: JSON.stringify(suggestions),
    },
  });

  await prisma.detectedRoom.deleteMany({ where: { projectId } });
  if (status === DetectionStatus.SUCCEEDED) {
    await prisma.detectedRoom.createMany({
      data: rooms.map((room) => ({
        projectId,
        name: room.name,
        roomType: room.roomType,
        confidence: room.confidence,
        adjacencyJson: JSON.stringify(room.adjacency),
        order: room.order,
      })),
    });
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      workflowStatus:
        status === DetectionStatus.SUCCEEDED ? WorkflowStatus.FLOORPLAN_UPLOADED : WorkflowStatus.ROOM_DETECT_FAILED,
    },
  });

  return asset;
}

export async function saveReferenceImage(projectId: string, file: File) {
  if (!file.type.startsWith("image/")) throw new Error("参考图只支持 JPG、PNG 或 WebP。");
  const saved = await saveUploadedFile(file, "reference");
  const image = sharp(saved.buffer, { failOn: "none" });
  const meta = await image.metadata();
  const thumbnailUrl = await createImagePreview(saved.buffer, "reference-thumb", 720);
  return prisma.referenceImage.create({
    data: {
      projectId,
      originalName: file.name,
      fileUrl: saved.fileUrl,
      thumbnailUrl,
      size: saved.size,
      width: meta?.width ?? null,
      height: meta?.height ?? null,
    },
  });
}

function extensionFromFile(file: File) {
  const ext = path.extname(file.name).toLowerCase();
  if (ext) return ext;
  if (file.type === "application/pdf") return ".pdf";
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  return ".jpg";
}

async function createImagePreview(buffer: Buffer, prefix: string, width: number) {
  const fileName = `${makeId(prefix)}.webp`;
  await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(uploadDir, fileName));
  return publicUploadPath(fileName);
}

async function renderPdfFirstPage(buffer: Buffer) {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
    }).promise;
    const page = await doc.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(3, Math.max(1.2, 1800 / baseViewport.width));
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context as never, viewport }).promise;
    const fileName = `${makeId("pdf-preview")}.png`;
    await sharp(canvas.toBuffer("image/png"), { failOn: "none" })
      .resize({ width: 1800, withoutEnlargement: true })
      .png({ quality: 90 })
      .toFile(path.join(uploadDir, fileName));
    return {
      previewUrl: publicUploadPath(fileName),
      width: canvas.width,
      height: canvas.height,
    };
  } catch {
    throw new Error("PDF 单页预览渲染失败，请上传未加密的矢量 PDF，或导出为高清图片后重试。");
  }
}

function estimatePdfPageCount(buffer: Buffer) {
  const text = buffer.toString("latin1");
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return Math.max(1, matches?.length ?? 1);
}

function inferRoomsFromName(name: string): DetectedRoomInput[] {
  const candidates = ["客餐厅", "主卧", "次卧", "厨房", "卫生间"];
  if (/一居|1房|one/i.test(name)) return buildRooms(["客餐厅", "主卧", "厨房", "卫生间"]);
  if (/三居|3房|three/i.test(name)) return buildRooms([...candidates, "书房"]);
  return buildRooms(candidates);
}

function detectRoomsFromDxf(text: string): DetectedRoomInput[] {
  const names = new Set<string>();
  const tokens = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const token of tokens) {
    const normalized = token.replace(/\s+/g, "");
    if (roomNameMap.some(([pattern]) => pattern.test(normalized))) {
      names.add(normalized.slice(0, 12));
    }
  }
  return buildRooms(Array.from(names));
}

function buildRooms(names: string[]): DetectedRoomInput[] {
  const unique = Array.from(new Set(names)).filter(Boolean);
  return unique.map((name, index) => ({
    name,
    roomType: classifyRoom(name),
    confidence: 0.72,
    adjacency: index === 0 ? unique.slice(1, 3) : [unique[0]],
    order: index + 1,
  }));
}

function classifyRoom(name: string): RoomType {
  return roomNameMap.find(([pattern]) => pattern.test(name))?.[1] ?? RoomType.OTHER;
}
