import Link from "next/link";
import { ProjectStatus } from "@prisma/client";
import { ArrowRight, Boxes, FileImage, Sparkles } from "lucide-react";
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
      <section className="blueprint-grid relative min-h-screen overflow-hidden">
        <div className="absolute inset-y-0 left-0 hidden w-[32vw] bg-midnight lg:block" />
        <div className="relative mx-auto grid min-h-screen max-w-[1440px] gap-10 px-4 py-5 sm:px-6 lg:grid-cols-[280px_1fr_460px] lg:px-8">
          <aside className="hidden rounded-2xl bg-midnight p-6 text-white shadow-glass lg:block">
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-aiPurple">
                  <Sparkles size={21} />
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Architectural Intelligence</p>
                <h2 className="mt-3 text-2xl font-semibold leading-8">AI 装修互动全景生成系统</h2>
              </div>
              <div className="space-y-4 text-sm text-white/70">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-white">输入</p>
                  <p className="mt-1">图片 / PDF / DXF 户型文件</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-white">输出</p>
                  <p className="mt-1">可复核、可发布的互动效果展示</p>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex flex-col justify-center py-10 lg:pl-4">
            <p className="eyebrow">AI spatial workflow</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-normal text-midnight sm:text-5xl">
              从标准户型图到可互动的装修效果展示
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              支持图片、PDF、DXF 户型输入，选择装修风格、上传参考图，通过 AI 对话调整设计方向，并批量生成房间效果图。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/admin" className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm">
                进入后台
                <ArrowRight size={16} />
              </Link>
              {featured && (
                <Link href={`/vr/${featured.id}`} className="btn-secondary inline-flex items-center gap-2 px-5 py-3 text-sm">
                  查看已发布项目
                </Link>
              )}
            </div>

            <div className="mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                { icon: FileImage, label: "图纸上传", value: "JPG / PDF / DXF" },
                { icon: Sparkles, label: "AI 风格", value: "预览与对话调整" },
                { icon: Boxes, label: "互动展示", value: "人工复核发布" },
              ].map((item) => (
                <div key={item.label} className="surface-card p-4">
                  <item.icon className="text-aiBlue" size={20} />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center pb-10 lg:pb-0">
            <div className="surface-card w-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slateLine px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Published preview</p>
                  <h2 className="mt-1 font-semibold">{featured?.title ?? "新建项目后从后台开始生成"}</h2>
                </div>
                <span className="status-pill bg-emerald-50 text-emerald-700">{projects.length} 个发布</span>
              </div>
              {featured?.coverUrl ? (
                <img src={featured.coverUrl} alt={featured.title} className="aspect-[16/10] w-full object-cover" />
              ) : (
                <div className="grid aspect-[16/10] place-items-center bg-slate-100 text-sm text-slate-500">暂无发布项目</div>
              )}
              <div className="grid grid-cols-3 divide-x divide-slateLine border-t border-slateLine text-center">
                <div className="p-4">
                  <p className="text-lg font-bold">{projects.length}</p>
                  <p className="text-xs text-slate-500">已发布</p>
                </div>
                <div className="p-4">
                  <p className="text-lg font-bold">{featured?.scenes.length ?? 0}</p>
                  <p className="text-xs text-slate-500">场景</p>
                </div>
                <div className="p-4">
                  <p className="text-lg font-bold">AI</p>
                  <p className="text-xs text-slate-500">生成</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
