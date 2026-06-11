import { NextResponse } from "next/server";
import { ImageProvider, WorkflowStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  styleId: z.string().min(1),
  provider: z.nativeEnum(ImageProvider).default(ImageProvider.OPENAI),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "请选择有效风格和模型供应商。" }, { status: 400 });
  const style = await prisma.designStyle.findUnique({ where: { id: parsed.data.styleId } });
  if (!style) return NextResponse.json({ error: "风格不存在，请先执行种子数据。" }, { status: 404 });
  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      selectedStyleId: parsed.data.styleId,
      selectedProvider: parsed.data.provider,
      workflowStatus: WorkflowStatus.STYLE_SELECTED,
    },
  });
  return NextResponse.json({ project });
}
