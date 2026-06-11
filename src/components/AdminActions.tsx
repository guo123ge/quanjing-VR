"use client";

import { ImageProvider } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateProjectForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        unitNo: formData.get("unitNo"),
        clientName: formData.get("clientName"),
        brandName: formData.get("brandName"),
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (response.ok) router.push(`/admin/projects/${data.project.id}`);
    else alert(data.error ?? "创建失败");
  }

  return (
    <form action={submit} className="grid gap-3 rounded border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold">新建 AI 装修项目</h2>
      <input name="title" required placeholder="项目名称" className="focus-ring rounded border px-3 py-2" />
      <input name="unitNo" placeholder="户型/编号，例如 84" className="focus-ring rounded border px-3 py-2" />
      <input name="clientName" placeholder="客户名称，可选" className="focus-ring rounded border px-3 py-2" />
      <input name="brandName" placeholder="展示品牌，例如 AI全景装修" className="focus-ring rounded border px-3 py-2" />
      <button disabled={busy} className="focus-ring rounded bg-ink px-4 py-2 text-white disabled:opacity-50">
        {busy ? "创建中..." : "创建项目"}
      </button>
    </form>
  );
}

export function UploadFloorplanForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    const response = await fetch(`/api/projects/${projectId}/floorplan`, { method: "POST", body: formData });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) alert(data.error ?? "上传失败");
    router.refresh();
  }

  return (
    <form action={submit} className="grid gap-3 rounded border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold">上传户型图 / PDF / DXF</h2>
      <input
        name="file"
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf,.dxf"
        required
        className="focus-ring rounded border px-3 py-2"
      />
      <button disabled={busy} className="focus-ring rounded bg-fern px-4 py-2 text-white disabled:opacity-50">
        {busy ? "识别中..." : "上传并自动识别"}
      </button>
    </form>
  );
}

export function StyleAndReferenceForm({
  projectId,
  styles,
  providers,
  selectedStyleId,
  selectedProvider,
}: {
  projectId: string;
  styles: Array<{ id: string; name: string; summary: string }>;
  providers: Array<{ provider: ImageProvider; label: string; configured: boolean; note: string }>;
  selectedStyleId?: string | null;
  selectedProvider: ImageProvider;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function saveStyle(formData: FormData) {
    setBusy(true);
    const response = await fetch(`/api/projects/${projectId}/style`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        styleId: formData.get("styleId"),
        provider: formData.get("provider"),
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) alert(data.error ?? "保存失败");
    router.refresh();
  }

  async function uploadReference(formData: FormData) {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return;
    setBusy(true);
    const response = await fetch(`/api/projects/${projectId}/reference`, { method: "POST", body: formData });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) alert(data.error ?? "上传参考图失败");
    router.refresh();
  }

  return (
    <section className="grid gap-4 rounded border border-stone-200 bg-white p-4 shadow-sm">
      <form action={saveStyle} className="grid gap-3">
        <h2 className="font-semibold">选择风格与生成模型</h2>
        <select name="styleId" defaultValue={selectedStyleId ?? styles[0]?.id} className="focus-ring rounded border px-3 py-2">
          {styles.map((style) => (
            <option value={style.id} key={style.id}>
              {style.name} - {style.summary}
            </option>
          ))}
        </select>
        <select name="provider" defaultValue={selectedProvider} className="focus-ring rounded border px-3 py-2">
          {providers.map((provider) => (
            <option value={provider.provider} key={provider.provider} disabled={!provider.configured}>
              {provider.label} - {provider.note}
            </option>
          ))}
        </select>
        <button disabled={busy} className="focus-ring rounded bg-ink px-4 py-2 text-white disabled:opacity-50">
          保存风格与模型
        </button>
      </form>
      <form action={uploadReference} className="grid gap-3 border-t pt-4">
        <h3 className="font-medium">上传风格参考照片</h3>
        <input name="file" type="file" accept="image/jpeg,image/png,image/webp" className="focus-ring rounded border px-3 py-2" />
        <button disabled={busy} className="focus-ring rounded border border-stone-300 px-4 py-2 disabled:opacity-50">
          上传参考图
        </button>
      </form>
    </section>
  );
}

export function ConversationForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    const message = String(formData.get("message") ?? "");
    if (!message.trim()) return;
    setBusy(true);
    const response = await fetch(`/api/projects/${projectId}/conversation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) alert(data.error ?? "对话保存失败");
    router.refresh();
  }

  return (
    <form action={submit} className="grid gap-3 rounded border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold">AI 风格调整对话</h2>
      <textarea
        name="message"
        rows={4}
        placeholder="例如：颜色再浅一点，不要大理石，增加收纳，更适合三口之家。"
        className="focus-ring rounded border px-3 py-2"
      />
      <button disabled={busy} className="focus-ring rounded bg-clay px-4 py-2 text-white disabled:opacity-50">
        {busy ? "记录中..." : "记录调整意见"}
      </button>
    </form>
  );
}

export function GenerationButtons({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function post(path: string, label: string) {
    setBusy(label);
    const response = await fetch(`/api/projects/${projectId}/${path}`, { method: "POST" });
    const data = await response.json();
    setBusy("");
    if (!response.ok) alert(data.error ?? `${label}失败`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => post("generate-preview", "生成风格预览")}
        disabled={Boolean(busy)}
        className="focus-ring rounded bg-brass px-4 py-2 text-white disabled:opacity-50"
      >
        {busy === "生成风格预览" ? "生成中..." : "生成风格预览"}
      </button>
      <button
        onClick={() => post("generate-rooms", "批量生成房间")}
        disabled={Boolean(busy)}
        className="focus-ring rounded bg-ink px-4 py-2 text-white disabled:opacity-50"
      >
        {busy === "批量生成房间" ? "生成中..." : "批量生成房间"}
      </button>
      <button
        onClick={() => post("publish", "发布项目")}
        disabled={Boolean(busy)}
        className="focus-ring rounded border border-stone-300 bg-white px-4 py-2 disabled:opacity-50"
      >
        发布项目
      </button>
    </div>
  );
}
