import { ImageProvider, JobKind, JobStatus, RenderMode, TaskStatus, WorkflowStatus } from "@prisma/client";
import { prisma } from "./db";
import { generateImage } from "./providers";
import { buildRoomPrompt, buildStylePrompt } from "./prompts";

export async function generateStylePreview(projectId: string) {
  const project = await getProjectBundle(projectId);
  if (!project.selectedStyleId) throw new Error("请先选择装修风格。");
  const style = await prisma.designStyle.findUniqueOrThrow({ where: { id: project.selectedStyleId } });
  const prompt = buildStylePrompt(style, project, project.references);
  const job = await prisma.generationJob.create({
    data: {
      projectId,
      provider: project.selectedProvider,
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
      kind: JobKind.STYLE_PREVIEW,
      status: JobStatus.RUNNING,
      progress: 10,
      tasks: { create: { prompt, status: TaskStatus.RUNNING } },
    },
    include: { tasks: true },
  });

  try {
    const result = await generateImage({
      provider: project.selectedProvider,
      prompt,
      referenceImageUrls: project.references.map((item) => item.fileUrl),
    });
    const task = job.tasks[0];
    await prisma.generationTask.update({
      where: { id: task.id },
      data: { status: TaskStatus.SUCCEEDED, imageUrl: result.imageUrl },
    });
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: JobStatus.SUCCEEDED, progress: 100 },
    });
    await prisma.project.update({
      where: { id: projectId },
      data: {
        previewImageUrl: result.imageUrl,
        coverUrl: result.imageUrl,
        workflowStatus: WorkflowStatus.STYLE_PREVIEW_READY,
      },
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "风格预览生成失败。";
    await prisma.generationTask.updateMany({
      where: { jobId: job.id },
      data: { status: TaskStatus.FAILED, errorMessage: message },
    });
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: JobStatus.FAILED, progress: 100, errorMessage: message },
    });
    throw error;
  }
}

export async function generateRoomBatch(projectId: string) {
  const project = await getProjectBundle(projectId);
  if (!project.selectedStyleId) throw new Error("请先选择装修风格。");
  if (project.rooms.length === 0) throw new Error("未识别到房间清单，请先重新上传更清晰的户型文件。");
  const style = await prisma.designStyle.findUniqueOrThrow({ where: { id: project.selectedStyleId } });
  const job = await prisma.generationJob.create({
    data: {
      projectId,
      provider: project.selectedProvider,
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
      kind: JobKind.ROOM_BATCH,
      status: JobStatus.RUNNING,
      progress: 1,
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { workflowStatus: WorkflowStatus.GENERATING_SCENES },
  });

  let success = 0;
  let failed = 0;
  const orderedRooms = [...project.rooms].sort((a, b) => a.order - b.order);
  for (let index = 0; index < orderedRooms.length; index += 1) {
    const room = orderedRooms[index];
    const prompt = buildRoomPrompt({ project, style, room, references: project.references });
    const task = await prisma.generationTask.create({
      data: { jobId: job.id, roomId: room.id, prompt, status: TaskStatus.RUNNING },
    });
    try {
      const result = await generateImage({ provider: project.selectedProvider, prompt });
      await prisma.scene.create({
        data: {
          projectId,
          roomId: room.id,
          name: room.name,
          renderMode: RenderMode.FLAT,
          imageUrl: result.imageUrl,
          thumbnailUrl: result.imageUrl,
          order: room.order,
        },
      });
      await prisma.generationTask.update({
        where: { id: task.id },
        data: { status: TaskStatus.SUCCEEDED, imageUrl: result.imageUrl },
      });
      success += 1;
    } catch (error) {
      failed += 1;
      await prisma.generationTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "房间生成失败。",
        },
      });
    }
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { progress: Math.round(((index + 1) / orderedRooms.length) * 100) },
    });
  }

  await rebuildHotspots(projectId);
  const status = failed > 0 ? JobStatus.PARTIAL_FAILED : JobStatus.SUCCEEDED;
  await prisma.generationJob.update({ where: { id: job.id }, data: { status, progress: 100 } });
  await prisma.project.update({
    where: { id: projectId },
    data: {
      workflowStatus: failed > 0 ? WorkflowStatus.PARTIAL_FAILED : WorkflowStatus.READY_FOR_REVIEW,
    },
  });
  return { success, failed };
}

export async function rebuildHotspots(projectId: string) {
  const scenes = await prisma.scene.findMany({ where: { projectId }, orderBy: { order: "asc" } });
  await prisma.hotspot.deleteMany({ where: { scene: { projectId } } });
  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const next = scenes[(index + 1) % scenes.length];
    const prev = scenes[(index - 1 + scenes.length) % scenes.length];
    if (next && next.id !== scene.id) {
      await prisma.hotspot.create({
        data: { sceneId: scene.id, targetSceneId: next.id, label: next.name, yaw: 38, pitch: -3 },
      });
    }
    if (prev && prev.id !== scene.id) {
      await prisma.hotspot.create({
        data: { sceneId: scene.id, targetSceneId: prev.id, label: prev.name, yaw: -115, pitch: -6 },
      });
    }
  }
}

async function getProjectBundle(projectId: string) {
  return prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      references: true,
      rooms: true,
    },
  });
}
