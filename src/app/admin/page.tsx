import Link from "next/link";
import { ArrowLeft, LayoutDashboard, Sparkles } from "lucide-react";
import { CreateProjectForm } from "@/components/AdminActions";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { rooms: true, scenes: true, jobs: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const publishedCount = projects.filter((project) => project.status === "PUBLISHED").length;

  return (
    <main className="min-h-screen bg-porcelain text-ink">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden bg-midnight p-6 text-white lg:block">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-aiPurple">
                <LayoutDashboard size={21} />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Admin workspace</p>
              <h1 className="mt-3 text-2xl font-semibold leading-8">AI 装修项目后台</h1>
              <p className="mt-4 text-sm leading-6 text-white/65">创建项目、上传户型图、生成风格预览和互动效果图。</p>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold text-white/85">
              <ArrowLeft size={16} />
              返回首页
            </Link>
          </div>
        </aside>

        <section className="blueprint-grid px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Project control center</p>
                <h2 className="mt-2 text-3xl font-bold tracking-normal text-midnight">项目管理</h2>
                <p className="mt-2 text-slate-600">所有草稿、生成任务和已发布互动展示集中管理。</p>
              </div>
              <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slateLine bg-white shadow-card">
                <Metric label="项目" value={projects.length} />
                <Metric label="发布" value={publishedCount} />
                <Metric label="场景" value={projects.reduce((sum, project) => sum + project.scenes.length, 0)} />
              </div>
            </header>

            <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
              <CreateProjectForm />
              <section className="surface-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slateLine px-5 py-4">
                  <div>
                    <p className="eyebrow">Portfolio</p>
                    <h2 className="mt-1 text-lg font-semibold">项目列表</h2>
                  </div>
                  <Sparkles className="text-aiPurple" size={20} />
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project) => (
                    <Link key={project.id} href={`/admin/projects/${project.id}`} className="group overflow-hidden rounded-xl border border-slateLine bg-white transition hover:-translate-y-0.5 hover:shadow-interactive">
                      <div className="aspect-video bg-slate-100">
                        {project.coverUrl ? (
                          <img src={project.coverUrl} alt={project.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-sm text-slate-400">等待生成预览</div>
                        )}
                      </div>
                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold leading-6 group-hover:text-aiBlue">{project.title}</h3>
                          <span className={`status-pill ${project.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                          <span>{project.workflowStatus}</span>
                          <span className="text-right">{project.rooms.length} 房间 / {project.scenes.length} 场景</span>
                        </div>
                        <p className="text-xs text-slate-400">更新于 {project.updatedAt.toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                  {projects.length === 0 && <div className="col-span-full p-12 text-center text-slate-500">暂无项目</div>}
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-24 border-r border-slateLine px-5 py-3 text-center last:border-r-0">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
