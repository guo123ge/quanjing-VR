import { NextResponse } from "next/server";
import { generateRoomBatch } from "@/lib/generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const result = await generateRoomBatch(params.id);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "房间效果图生成失败。" }, { status: 400 });
  }
}
