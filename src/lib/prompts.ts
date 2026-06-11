import type { DetectedRoom, DesignStyle, Project, ReferenceImage } from "@prisma/client";

export function buildStylePrompt(style: DesignStyle, project: Project, references: ReferenceImage[]) {
  const referenceNote =
    references.length > 0
      ? `用户上传了 ${references.length} 张风格参考照片，请保持整体气质一致，但不要复制原图构图。`
      : "用户未上传参考照片，请严格依据预设风格生成。";
  return [
    `为住宅装修项目“${project.title}”生成一张客餐厅风格预览图。`,
    `风格：${style.name}。${style.summary}`,
    `关键词：${style.keywords}。`,
    `色彩：${style.palette}。材质：${style.materials}。灯光：${style.lighting}。`,
    `用户补充要求：${project.designBrief || "暂无"} ${project.promptOverrides || ""}`,
    referenceNote,
    `负面约束：${style.negative}。`,
    "输出真实室内设计效果图，无文字、无水印、无Logo、不要拼贴图。",
  ].join("\n");
}

export function buildRoomPrompt(input: {
  project: Project;
  style: DesignStyle;
  room: DetectedRoom;
  references: ReferenceImage[];
}) {
  const { project, style, room, references } = input;
  const referenceNote = references.length > 0 ? "结合用户参考图的色彩和材质气质。" : "依据预设风格完成设计。";
  return [
    `为住宅项目“${project.title}”生成“${room.name}”装修效果图。`,
    `空间类型：${room.roomType}。`,
    `整体风格：${style.name}，${style.summary}`,
    `关键词：${style.keywords}。`,
    `色彩：${style.palette}。材质：${style.materials}。灯光：${style.lighting}。`,
    `用户对话后确认的设计要求：${project.designBrief || "舒适、真实、适合落地施工"} ${project.promptOverrides || ""}`,
    referenceNote,
    `房间专项建议：${style.roomTips}`,
    `避免：${style.negative}`,
    "生成一张真实、完整、横向室内效果图，无文字、无水印、无Logo、不要过度超现实。",
  ].join("\n");
}

export function updateDesignBrief(previous: string, userMessage: string) {
  const trimmed = userMessage.trim();
  if (!previous) return trimmed;
  return `${previous}\n- ${trimmed}`;
}
