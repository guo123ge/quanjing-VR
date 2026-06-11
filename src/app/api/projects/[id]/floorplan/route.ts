import { NextResponse } from "next/server";
import { ingestFloorplan } from "@/lib/floorplan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "请选择户型图、PDF 或 DXF 文件。" }, { status: 400 });
    }
    const asset = await ingestFloorplan(params.id, file);
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "户型文件上传失败。" }, { status: 400 });
  }
}
