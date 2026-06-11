import { NextResponse } from "next/server";
import { ProjectStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

const createProjectSchema = z.object({
  title: z.string().min(1).max(80),
  unitNo: z.string().max(40).optional().default(""),
  clientName: z.string().max(80).optional().default(""),
  brandName: z.string().max(80).optional().default("AI全景装修"),
});

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { rooms: true, scenes: true, jobs: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const parsed = createProjectSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "项目名称不能为空，且字段长度需符合要求。" }, { status: 400 });
  }
  const project = await prisma.project.create({ data: { ...parsed.data, status: ProjectStatus.DRAFT } });
  return NextResponse.json({ project }, { status: 201 });
}
