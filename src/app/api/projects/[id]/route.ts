import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      floorplans: { orderBy: { createdAt: "desc" } },
      rooms: { orderBy: { order: "asc" } },
      references: true,
      conversations: { orderBy: { createdAt: "asc" } },
      jobs: { include: { tasks: true }, orderBy: { createdAt: "desc" } },
      scenes: { include: { hotspots: true }, orderBy: { order: "asc" } },
    },
  });
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  return NextResponse.json({ project });
}
