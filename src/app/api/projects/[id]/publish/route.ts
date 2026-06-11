import { NextResponse } from "next/server";
import { ProjectStatus, WorkflowStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({ where: { id: params.id }, include: { scenes: true } });
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  if (project.scenes.length === 0) return NextResponse.json({ error: "请先生成至少一个房间场景。" }, { status: 400 });
  const updated = await prisma.project.update({
    where: { id: params.id },
    data: { status: ProjectStatus.PUBLISHED, workflowStatus: WorkflowStatus.PUBLISHED },
  });
  return NextResponse.json({ project: updated });
}
