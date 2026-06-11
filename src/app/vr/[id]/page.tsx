import { notFound } from "next/navigation";
import { ProjectStatus } from "@prisma/client";
import { InteractiveViewer } from "@/components/InteractiveViewer";
import { prisma } from "@/lib/db";

export default async function VRPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { preview?: string };
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { scenes: { include: { hotspots: true }, orderBy: { order: "asc" } } },
  });
  if (!project) notFound();
  if (searchParams.preview !== "1" && project.status !== ProjectStatus.PUBLISHED) notFound();
  if (searchParams.preview !== "1") {
    await prisma.project.update({ where: { id: project.id }, data: { viewCount: { increment: 1 } } });
  }
  return <InteractiveViewer project={project} />;
}
