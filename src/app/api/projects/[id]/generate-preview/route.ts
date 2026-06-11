import { NextResponse } from "next/server";
import { generateStylePreview } from "@/lib/generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const result = await generateStylePreview(params.id);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "风格预览生成失败。" }, { status: 400 });
  }
}
