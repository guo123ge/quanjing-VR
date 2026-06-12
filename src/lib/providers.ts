import { ImageProvider } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { makeId, publicUploadPath, uploadDir } from "./paths";
import type { GenerationResult, ProviderStatus } from "./types";

export const defaultOpenAiImageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

export function getProviderStatuses(): ProviderStatus[] {
  return [
    {
      provider: ImageProvider.OPENAI,
      label: "OpenAI GPT Image",
      configured: Boolean(process.env.OPENAI_API_KEY),
      note: process.env.OPENAI_API_KEY ? `默认模型 ${defaultOpenAiImageModel}` : "需要配置 OPENAI_API_KEY",
    },
    {
      provider: ImageProvider.ALIYUN,
      label: "阿里云百炼万相 / Qwen-Image",
      configured: Boolean(process.env.ALIYUN_IMAGE_API_KEY),
      note: "已预留适配层，接入密钥后可扩展真实调用",
    },
    {
      provider: ImageProvider.VOLCENGINE,
      label: "火山引擎 Seedream",
      configured: Boolean(process.env.VOLCENGINE_IMAGE_API_KEY),
      note: "已预留适配层，接入密钥后可扩展真实调用",
    },
    {
      provider: ImageProvider.TENCENT,
      label: "腾讯混元生图",
      configured: Boolean(process.env.TENCENT_IMAGE_API_KEY),
      note: "已预留适配层，接入密钥后可扩展真实调用",
    },
  ];
}

export function assertProviderConfigured(provider: ImageProvider) {
  const status = getProviderStatuses().find((item) => item.provider === provider);
  if (!status?.configured) {
    throw new Error(`${status?.label ?? provider} 尚未配置密钥，无法生成图片。`);
  }
}

export async function generateImage(input: {
  provider: ImageProvider;
  prompt: string;
  referenceImageUrls?: string[];
}): Promise<GenerationResult> {
  if (input.provider !== ImageProvider.OPENAI) {
    assertProviderConfigured(input.provider);
    throw new Error("该国内模型供应商已预留配置入口，真实调用适配将在后续供应商密钥确认后接入。");
  }

  assertProviderConfigured(ImageProvider.OPENAI);
  const model = defaultOpenAiImageModel;
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: input.prompt,
      size: "1536x1024",
      quality: "medium",
      n: 1,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI 图片生成失败：${errorText.slice(0, 240)}`);
  }
  const data = (await response.json()) as { data?: Array<{ b64_json?: string }> };

  const b64 = data.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI 未返回可保存的图片数据。");
  }

  await fs.mkdir(uploadDir, { recursive: true });
  const fileName = `${makeId("generated")}.webp`;
  const filePath = path.join(uploadDir, fileName);
  await sharp(Buffer.from(b64, "base64"), { failOn: "none" })
    .resize({ width: 1536, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(filePath);

  return {
    imageUrl: publicUploadPath(fileName),
    prompt: input.prompt,
    provider: input.provider,
    model,
  };
}
