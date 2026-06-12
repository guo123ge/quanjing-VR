import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import {
  ConversationForm,
  GenerationButtons,
  StyleAndReferenceForm,
  UploadFloorplanForm,
} from "@/components/AdminActions";
import { prisma } from "@/lib/db";
import { getProviderStatuses } from "@/lib/providers";
import { uploadRequirements } from "@/lib/requirements";

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

  return (
    <main className="blueprint-grid min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-midnight p-5 text-white shadow-glass">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white">
              <ArrowLeft size={16} />
              返回项目列表
            </Link>
            <h1 className="mt-3 text-3xl font-semibold">{project.title}</h1>
            <p className="mt-2 text-white/65">
              {project.workflowStatus} / {project.status} / {project.rooms.length} 个识别房间 / {project.scenes.length} 个场景
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/vr/${project.id}?preview=1`} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              <ExternalLink size={15} />
              后台预览
            </Link>
            {project.status === "PUBLISHED" && (
              <Link href={`/vr/${project.id}`} target="_blank" className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
                打开发布页
              </Link>
            )}
          </div>
        </header>

        <div className="mb-6 grid gap-3 md:grid-cols-5">
          {["上传图纸", "自动识别", "风格预览", "批量生成", "复核发布"].map((step, index) => (
            <div key={step} className="surface-card p-3 text-sm">
              <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-aiBlue text-xs font-bold text-white">{index + 1}</span>
              {step}
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[410px_1fr]">
          <aside className="space-y-6">
            <UploadFloorplanForm projectId={project.id} />
            <section className="surface-card p-5">
              <p className="eyebrow">input quality</p>
              <h2 className="mt-1 font-semibold">上传格式要求</h2>
              <div className="mt-4 space-y-4">
                {uploadRequirements.map((item) => (
                  <details key={item.type} open={item.type === "IMAGE"} className="rounded-xl border border-slateLine bg-slate-50 p-3">
                    <summary className="cursor-pointer font-medium">{item.title}</summary>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
                      {item.checks.map((check) => (
                        <li key={check}>{check}</li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>
            <StyleAndReferenceForm
              projectId={project.id}
              styles={styles}
              providers={getProviderStatuses()}
              selectedStyleId={project.selectedStyleId}
              selectedProvider={project.selectedProvider}
            />
            <ConversationForm projectId={project.id} />
          </aside>

          <section className="space-y-6">
            <div className="surface-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">generation console</p>
                  <h2 className="mt-1 font-semibold">生成控制</h2>
                </div>
                <GenerationButtons projectId={project.id} />
              </div>
              {project.previewImageUrl && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slateLine">
                  <img src={project.previewImageUrl} alt="风格预览" className="h-72 w-full object-cover" />
                </div>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <InfoPanel title="户型识别结果">
                {latestFloorplan?.status === "FAILED" && (
                  <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    <p className="font-medium">{latestFloorplan.errorMessage}</p>
                    <ul className="mt-2 list-disc pl-5">
                      {JSON.parse(latestFloorplan.suggestionsJson || "[]").map((tip: string) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3 space-y-2">
                  {project.rooms.map((room) => (
                    <div key={room.id} className="flex justify-between rounded-xl border border-slateLine bg-slate-50 px-3 py-2 text-sm">
                      <span>{room.order}. {room.name}</span>
                      <span className="text-slate-500">{room.roomType} / {Math.round(room.confidence * 100)}%</span>
                    </div>
                  ))}
                  {project.rooms.length === 0 && <p className="text-sm text-slate-500">尚未识别到房间。</p>}
                </div>
              </InfoPanel>

              <InfoPanel title="AI 对话记录">
                <div className="space-y-2">
                  {project.conversations.map((message) => (
                    <div key={message.id} className="rounded-xl border border-slateLine bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-medium">{message.role === "USER" ? "用户" : "AI"}：</span>
                      {message.content}
                    </div>
                  ))}
                  {project.conversations.length === 0 && <p className="text-sm text-slate-500">还没有风格调整记录。</p>}
                </div>
              </InfoPanel>
            </div>

            <InfoPanel title="房间生成结果">
              <div className="grid gap-4 md:grid-cols-2">
                {project.scenes.map((scene) => (
                  <article key={scene.id} className="overflow-hidden rounded-xl border border-slateLine transition hover:shadow-interactive">
                    <img src={scene.thumbnailUrl} alt={scene.name} className="h-44 w-full object-cover" />
                    <div className="p-3">
                      <h3 className="font-medium">{scene.name}</h3>
                      <p className="text-xs text-slate-500">{scene.renderMode}</p>
                    </div>
                  </article>
                ))}
              </div>
              {project.scenes.length === 0 && <p className="text-sm text-slate-500">尚未生成房间效果图。</p>}
            </InfoPanel>

            <InfoPanel title="最近生成任务">
              <div className="space-y-2">
                {project.jobs.slice(0, 4).map((job) => (
                  <div key={job.id} className="rounded-xl border border-slateLine bg-slate-50 p-3 text-sm">
                    <div className="flex justify-between">
                      <span>{job.kind} / {job.provider}</span>
                      <span className="inline-flex items-center gap-1 text-aiBlue"><CheckCircle2 size={14} />{job.status} / {job.progress}%</span>
                    </div>
                    {job.errorMessage && <p className="mt-1 text-red-600">{job.errorMessage}</p>}
                  </div>
                ))}
                {project.jobs.length === 0 && <p className="text-sm text-slate-500">尚无生成任务。</p>}
              </div>
            </InfoPanel>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="text-aiPurple" size={16} />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
