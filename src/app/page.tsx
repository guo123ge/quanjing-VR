import Link from "next/link";
import { ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    where: { status: ProjectStatus.PUBLISHED },
    include: { scenes: true },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });
  const featured = projects[0];

  return (
    <main className="min-h-screen bg-porcelain text-ink">
      <section className="mx-auto grid min-h-screen max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_460px] lg:items-center">
        <div>
          <p className="mb-4 text-sm font-semibold text-fern">AI 装修互动全景生成系统</p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-normal">
            从户型图到可互动的装修效果展示
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            支持图片、PDF、DXF 户型输入，选择装修风格、上传参考图，通过 AI 对话调整设计方向，并批量生成房间效果图。
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/admin" className="rounded bg-ink px-5 py-3 text-sm font-medium text-white">
              进入后台
            </Link>
            {featured && (
              <Link href={`/vr/${featured.id}`} className="rounded border border-stone-300 bg-white px-5 py-3 text-sm font-medium">
                查看已发布项目
              </Link>
            )}
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl">
          {featured?.coverUrl ? (
            <img src={featured.coverUrl} alt={featured.title} className="h-[420px] w-full object-cover" />
          ) : (
            <div className="grid h-[420px] place-items-center bg-stone-100 text-stone-500">暂无发布项目</div>
          )}
          <div className="p-5">
            <h2 className="font-semibold">{featured?.title ?? "新建项目后从后台开始生成"}</h2>
            <p className="mt-1 text-sm text-stone-500">已发布项目 {projects.length} 个</p>
          </div>
        </div>
      </section>
    </main>
  );
}
