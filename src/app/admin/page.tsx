import Link from "next/link";
import { CreateProjectForm } from "@/components/AdminActions";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { rooms: true, scenes: true, jobs: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <main className="min-h-screen bg-porcelain px-6 py-8 text-ink">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">AI 装修项目后台</h1>
            <p className="mt-2 text-stone-600">创建项目、上传户型图、生成风格预览和互动效果图。</p>
          </div>
          <Link href="/" className="rounded border border-stone-300 bg-white px-4 py-2 text-sm">
            返回首页
          </Link>
        </header>
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <CreateProjectForm />
          <section className="rounded border border-stone-200 bg-white shadow-sm">
            <div className="border-b p-4">
              <h2 className="font-semibold">项目列表</h2>
            </div>
            <div className="divide-y">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="grid gap-4 p-4 transition hover:bg-stone-50 md:grid-cols-[150px_1fr_auto]"
                >
                  <div className="h-24 overflow-hidden rounded bg-stone-100">
                    {project.coverUrl ? <img src={project.coverUrl} alt={project.title} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div>
                    <h3 className="font-semibold">{project.title}</h3>
                    <p className="mt-1 text-sm text-stone-500">
                      {project.workflowStatus} / {project.rooms.length} 个房间 / {project.scenes.length} 个场景
                    </p>
                    <p className="mt-2 text-xs text-stone-400">更新于 {project.updatedAt.toLocaleString()}</p>
                  </div>
                  <span className="h-fit rounded bg-stone-100 px-3 py-1 text-sm">{project.status}</span>
                </Link>
              ))}
              {projects.length === 0 && <div className="p-10 text-center text-stone-500">暂无项目</div>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
