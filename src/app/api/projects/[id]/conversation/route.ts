import { NextResponse } from "next/server";
import { MessageRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { updateDesignBrief } from "@/lib/prompts";

const schema = z.object({ message: z.string().min(1).max(500) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "请输入需要调整的风格意见。" }, { status: 400 });
  const project = await prisma.project.findUniqueOrThrow({ where: { id: params.id } });
  const userMessage = parsed.data.message.trim();
  const brief = updateDesignBrief(project.designBrief, userMessage);
  await prisma.designConversationMessage.createMany({
    data: [
      { projectId: params.id, role: MessageRole.USER, content: userMessage },
      {
        projectId: params.id,
        role: MessageRole.ASSISTANT,
        content: `已记录调整：${userMessage}。重新生成预览时会同步到色彩、材质、灯光和负面约束中。`,
      },
    ],
  });
  const updated = await prisma.project.update({ where: { id: params.id }, data: { designBrief: brief } });
  return NextResponse.json({ project: updated });
}
