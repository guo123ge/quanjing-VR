import { FloorplanFileType } from "@prisma/client";
import type { UploadRequirement } from "./types";

export const uploadRequirements: UploadRequirement[] = [
  {
    type: FloorplanFileType.IMAGE,
    title: "图片户型图 JPG / PNG / WebP",
    accept: "image/jpeg,image/png,image/webp",
    maxSizeMb: 30,
    checks: [
      "建议不低于 2000 x 1500 像素，推荐长边 3000 像素以上。",
      "整套户型必须完整，不裁掉房间名、尺寸线、门窗或墙体。",
      "优先使用黑白或浅色背景户型图，减少营销海报、水印和装饰背景。",
      "图片保持正向，不倾斜、不透视变形、不模糊。",
      "房间文字标注清晰，例如客厅、主卧、厨房、卫生间。",
    ],
    failureTips: [
      "请重新导出高清户型图或上传更清晰截图。",
      "请裁掉无关宣传区域，但保留完整墙体、门窗和房间文字。",
      "手机拍照请保持正对图纸，确保四角完整、光线均匀。",
    ],
  },
  {
    type: FloorplanFileType.PDF,
    title: "PDF 户型图",
    accept: "application/pdf",
    maxSizeMb: 80,
    checks: [
      "优先上传矢量 PDF；扫描 PDF 建议不低于 300 DPI。",
      "第一版只识别单页户型图；多页 PDF 需要选择其中一页。",
      "PDF 不得加密，不得需要密码打开。",
      "页面应以单套户型图为主体，避免混入报价表、多套户型或大段宣传文案。",
      "建议保留文字图层和矢量线条，不要转成低清图片。",
    ],
    failureTips: [
      "请解除 PDF 密码或导出无加密版本。",
      "请上传只包含目标户型的单页 PDF，或选择正确页面。",
      "如果是扫描件，请重新扫描到 300 DPI 以上。",
    ],
  },
  {
    type: FloorplanFileType.DXF,
    title: "DXF 二维户型图",
    accept: ".dxf,application/dxf,application/x-dxf",
    maxSizeMb: 50,
    checks: [
      "仅支持二维平面户型图 DXF，不支持三维模型、立面图、剖面图。",
      "建议使用 AutoCAD 兼容 DXF R12/2000/2007/2010。",
      "图纸单位需明确，优先使用毫米 mm。",
      "墙体、门、窗、文字标注建议分层清晰，例如 WALL / DOOR / WINDOW / TEXT / DIM。",
      "房间边界尽量使用闭合多段线，减少断线、重线、碎线。",
      "房间名称需保留普通文字对象，不要全部转曲线。",
      "不支持 DWG；请先另存为 DXF。",
    ],
    failureTips: [
      "请清理无关图层、图框、外部参照、隐藏对象和过密家具装饰。",
      "请保留房间文字对象，并尽量闭合墙体边界。",
      "如果只有 DWG，请在 CAD 软件中另存为 DXF 后再上传。",
    ],
  },
];

export function requirementFor(type: FloorplanFileType) {
  return uploadRequirements.find((item) => item.type === type) ?? uploadRequirements[0];
}
