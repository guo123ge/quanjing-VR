import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, CheckCircle2, Clock3, ExternalLink, Folder, Info, LogOut, Settings, Sparkles, UserCircle2 } from "lucide-react";
import {
  ConversationForm,
  GenerationButtons,
  StyleAndReferenceForm,
  UploadFloorplanForm,
} from "@/components/AdminActions";
import { prisma } from "@/lib/db";
import { getProviderStatuses } from "@/lib/providers";
import { uploadRequirements } from "@/lib/requirements";

const workflowSteps = [
  "上传户型图",
  "户型自动识别",
  "风格选择",
  "批量生成方案",
  "发布方案",
];

export default async function ProjectWorkspace({ params }: { params: { id: string } }) {
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
  if (!project) notFound();
  const styles = await prisma.designStyle.findMany({ orderBy: { sortOrder: "asc" } });
  const latestFloorplan = project.floorplans[0];
  const latestJob = project.jobs[0];
  const completedSteps = Math.min(2 + (project.selectedStyleId ? 1 : 0) + (project.scenes.length > 0 ? 1 : 0) + (project.status === "PUBLISHED" ? 1 : 0), 5);

  return (
    <main className="aura-console">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 px-5 py-3 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-3 text-white">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 shadow-[0_0_28px_rgba(139,92,246,0.45)]">
                <Sparkles size={22} />
              </span>
              <span className="text-lg font-bold text-purple-200">AuraDesign VR</span>
            </Link>
            <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-300 lg:flex">
              <span>AI 装修项目控制台</span>
              <Link href="/admin" className="border-b-2 border-cyan-400 pb-4 text-white">项目列表</Link>
              <span className="text-slate-500">项目详情</span>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <Settings size={20} />
            <Bell size={20} />
            <UserCircle2 className="text-cyan-300" size={28} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[118px_1fr_342px]">
        <aside className="hidden min-h-[calc(100vh-65px)] border-r border-white/10 bg-slate-950/42 py-7 text-slate-300 lg:block">
          <SideItem active icon={<Info size={23} />} label="项目信息" />
          <SideItem icon={<Folder size={23} />} label="资源库" />
          <SideItem icon={<Settings size={23} />} label="设置" />
          <div className="mt-80 space-y-4 px-5 text-xs text-slate-400">
            <div className="flex items-center gap-2"><Settings size={15} />项目信息</div>
            <div className="flex items-center gap-2"><Info size={15} />技术支持</div>
            <div className="flex items-center gap-2"><LogOut size={15} />退出登录</div>
          </div>
        </aside>

        <section className="aura-scanline min-w-0 px-4 py-7 sm:px-7">
          <ProgressRail completedSteps={completedSteps} />

          <section className="mt-8">
            <SectionTitle en="PROJECT METADATA" cn="项目元数据" />
            <div className="aura-glass mt-3 grid gap-3 p-4 sm:grid-cols-4">
              <Meta label="项目名称" value={project.title} />
              <Meta label="项目编号" value={project.unitNo || "PRJ - 2024 - 089A"} />
              <Meta label="客户信息" value={project.clientName || "Vanguard Developments"} />
              <Meta label="品牌标准" value={project.brandName || "Aura Elite Tier"} />
            </div>
          </section>

          <section className="mt-7">
            <SectionTitle en="Floorplan Recognition Results" cn="户型识别结果" />
            {latestFloorplan?.status === "FAILED" && (
              <div className="mt-3 rounded-2xl border border-red-400/35 bg-red-950/30 p-4 text-sm text-red-100">
                <p className="font-semibold">{latestFloorplan.errorMessage}</p>
                <ul className="mt-2 list-disc pl-5">
                  {JSON.parse(latestFloorplan.suggestionsJson || "[]").map((tip: string) => <li key={tip}>{tip}</li>)}
                </ul>
              </div>
            )}
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              {project.rooms.slice(0, 3).map((room) => (
                <article key={room.id} className="aura-glass aura-neon-border p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold">{room.name}</h3>
                    <p className="font-semibold text-emerald-300">{Math.round(room.confidence * 100)}% 置信度</p>
                  </div>
                  <div className="mt-3 h-20 rounded-lg border border-cyan-300/25 bg-cyan-400/10 p-2">
                    <div className="h-full rounded border border-cyan-300/35 bg-[linear-gradient(90deg,rgba(56,189,248,.2)_1px,transparent_1px),linear-gradient(rgba(56,189,248,.2)_1px,transparent_1px)] bg-[length:14px_14px]" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-semibold">{room.roomType}</span>
                    <span className="rounded-lg border border-cyan-300/40 bg-cyan-400/15 px-5 py-2 text-sm font-semibold text-cyan-100">编辑</span>
                  </div>
                </article>
              ))}
              {project.rooms.length === 0 && <div className="aura-glass col-span-full p-8 text-center text-slate-300">尚未识别到房间。</div>}
            </div>
          </section>

          <section className="mt-7">
            <SectionTitle en="Generation Previews" cn="方案生成预览" />
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {project.scenes.slice(0, 2).map((scene) => (
                <article key={scene.id} className="group relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/70 shadow-glass">
                  <img src={scene.thumbnailUrl} alt={scene.name} className="h-44 w-full object-cover opacity-90 transition group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/55" />
                  <h3 className="absolute left-4 top-4 text-xl font-bold">{scene.name}</h3>
                  <span className="absolute right-4 top-4 rounded-full bg-emerald-400/18 px-3 py-1 text-sm font-semibold text-emerald-200">已生成</span>
                </article>
              ))}
              {project.scenes.length === 0 && (
                <>
                  <div className="aura-glass flex h-44 items-center justify-center rounded-2xl border-emerald-300/30 text-slate-300">等待生成首张方案预览</div>
                  <div className="aura-glass flex h-44 flex-col items-center justify-center rounded-2xl text-slate-300">
                    <Clock3 className="mb-3 text-purple-200" size={38} />
                    待处理
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="mt-7 grid gap-4 lg:grid-cols-2">
            <InfoPanel title="上传格式要求">
              <div className="space-y-3">
                {uploadRequirements.map((item) => (
                  <details key={item.type} open={item.type === "IMAGE"} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <summary className="cursor-pointer font-semibold">{item.title}</summary>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
                      {item.checks.map((check) => <li key={check}>{check}</li>)}
                    </ul>
                  </details>
                ))}
              </div>
            </InfoPanel>
            <InfoPanel title="最近生成任务">
              <div className="space-y-3">
                {project.jobs.slice(0, 4).map((job) => (
                  <div key={job.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                    <div className="flex justify-between">
                      <span>{job.kind} / {job.provider}</span>
                      <span className="inline-flex items-center gap-1 text-cyan-300"><CheckCircle2 size={14} />{job.status} / {job.progress}%</span>
                    </div>
                    {job.errorMessage && <p className="mt-1 text-red-300">{job.errorMessage}</p>}
                  </div>
                ))}
                {project.jobs.length === 0 && <p className="text-sm text-slate-400">尚无生成任务。</p>}
              </div>
            </InfoPanel>
          </section>
        </section>

        <aside className="border-l border-white/10 bg-slate-950/35 px-4 py-7">
          <div className="sticky top-24 space-y-4">
            <div className="aura-glass overflow-hidden">
              <div className="flex border-b border-white/10">
                <div className="flex-1 rounded-br-2xl border-r border-white/10 bg-white/8 px-4 py-3 text-lg font-bold">AI 装修引擎</div>
                <div className="px-7 py-3 text-slate-400">对话</div>
              </div>
              <div className="space-y-4 p-4">
                <StyleAndReferenceForm
                  projectId={project.id}
                  styles={styles}
                  providers={getProviderStatuses()}
                  selectedStyleId={project.selectedStyleId}
                  selectedProvider={project.selectedProvider}
                />
                <UploadFloorplanForm projectId={project.id} />
                <ConversationForm projectId={project.id} />
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-200">Style Feedback & Adjustment</p>
                  <GenerationButtons projectId={project.id} />
                </div>
              </div>
            </div>

            <div className="aura-glass p-4">
              <h2 className="text-lg font-bold">实时任务进程</h2>
              <div className="mt-4 space-y-4">
                <TaskBar label="纹理烘焙" value={latestJob?.progress ?? 0} suffix={latestJob ? `${latestJob.progress}%` : "待处理"} />
                <TaskBar label="灯光渲染" value={project.scenes.length > 0 ? 100 : 8} suffix={project.scenes.length > 0 ? "已完成" : "待处理"} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ProgressRail({ completedSteps }: { completedSteps: number }) {
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-5">
      <div className="absolute left-[10%] right-[10%] top-10 h-1 rounded-full bg-white/12" />
      <div className="absolute left-[10%] top-10 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_28px_rgba(139,92,246,.8)]" style={{ width: `${Math.max(0, (completedSteps - 1) * 20)}%` }} />
      <div className="relative grid grid-cols-5 gap-3">
        {workflowSteps.map((step, index) => {
          const done = index + 1 < completedSteps;
          const active = index + 1 === completedSteps;
          return (
            <div key={step} className="text-center">
              <span className={`mx-auto grid h-7 w-7 place-items-center rounded-full border ${done ? "border-cyan-300 bg-cyan-400/25 text-cyan-100" : active ? "border-purple-300 bg-purple-400 text-white shadow-[0_0_24px_rgba(168,85,247,.85)]" : "border-white/20 bg-white/10 text-slate-400"}`}>
                {done ? "✓" : ""}
              </span>
              <p className="mt-3 text-sm font-semibold">{index + 1}. {step}</p>
              <p className={`text-xs ${done ? "text-cyan-300" : active ? "text-purple-300" : "text-slate-500"}`}>{done ? "已完成" : active ? "进行中" : "待处理"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionTitle({ en, cn }: { en: string; cn: string }) {
  return (
    <h2 className="text-xl font-bold">
      <span>{en}</span>
      <span className="ml-4 text-slate-200">{cn}</span>
    </h2>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-white/10 px-2 last:border-r-0">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function TaskBar({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="text-cyan-300">{suffix}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 shadow-[0_0_18px_rgba(217,70,239,.8)]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function SideItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`relative grid gap-2 px-4 py-4 text-center text-sm ${active ? "bg-cyan-300/10 text-white" : "text-slate-400"}`}>
      {active && <span className="absolute left-0 top-0 h-full w-1 bg-purple-400 shadow-[0_0_18px_rgba(168,85,247,.8)]" />}
      <span className="mx-auto">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="aura-glass p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="text-purple-300" size={16} />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
