import { NextResponse } from "next/server";
import { saveReferenceImage } from "@/lib/floorplan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "请选择风格参考图片。" }, { status: 400 });
    }
    const reference = await saveReferenceImage(params.id, file);
    return NextResponse.json({ reference }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "参考图上传失败。" }, { status: 400 });
  }
}
