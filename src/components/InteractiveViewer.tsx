"use client";

import { Maximize2, Share2 } from "lucide-react";
import { useMemo, useState } from "react";

type Scene = {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
  order: number;
  hotspots: Array<{ id: string; targetSceneId: string; label: string; yaw: number; pitch: number }>;
};

export function InteractiveViewer({ project }: { project: { title: string; brandName: string; scenes: Scene[] } }) {
  const scenes = useMemo(() => [...project.scenes].sort((a, b) => a.order - b.order), [project.scenes]);
  const [currentId, setCurrentId] = useState(scenes[0]?.id ?? "");
  const [toast, setToast] = useState("");
  const current = scenes.find((scene) => scene.id === currentId) ?? scenes[0];

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: project.title, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        setToast("链接已复制");
      }
    } catch {
      setToast("分享已取消");
    }
    window.setTimeout(() => setToast(""), 1600);
  }

  async function fullscreen() {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen().catch(() => undefined);
    else await document.exitFullscreen().catch(() => undefined);
  }

  if (!current) {
    return <main className="grid min-h-screen place-items-center bg-ink text-white">暂无可展示场景</main>;
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <img src={current.imageUrl} alt={current.name} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/25" />
      <header className="absolute left-0 top-0 z-20 flex w-full justify-between gap-4 px-6 py-5">
        <div>
          <h1 className="text-2xl font-semibold drop-shadow">{project.title}</h1>
          <p className="mt-2 text-sm text-white/80">{project.brandName}</p>
        </div>
        <div className="text-right text-sm text-white/85">{current.name}</div>
      </header>
      <div className="absolute right-6 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-4">
        <button onClick={fullscreen} className="grid h-12 w-12 place-items-center rounded-full bg-black/40 backdrop-blur">
          <Maximize2 size={22} />
        </button>
        <button onClick={share} className="grid h-12 w-12 place-items-center rounded-full bg-black/40 backdrop-blur">
          <Share2 size={22} />
        </button>
      </div>
      {current.hotspots.map((hotspot, index) => (
        <button
          key={hotspot.id}
          onClick={() => setCurrentId(hotspot.targetSceneId)}
          className="absolute z-20 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-ink shadow-lg"
          style={{ left: `${index % 2 === 0 ? 64 : 34}%`, top: `${index % 2 === 0 ? 55 : 66}%` }}
        >
          {hotspot.label}
        </button>
      ))}
      <nav className="absolute bottom-0 left-0 z-20 w-full bg-black/45 px-24 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => setCurrentId(scene.id)}
              className={`relative h-24 w-28 flex-none overflow-hidden rounded border-2 ${
                scene.id === current.id ? "border-brass" : "border-transparent opacity-80"
              }`}
            >
              <img src={scene.thumbnailUrl} alt={scene.name} className="h-full w-full object-cover" />
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-1 text-xs">{scene.name}</span>
            </button>
          ))}
        </div>
      </nav>
      {toast && <div className="absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded bg-black/75 px-4 py-2 text-sm">{toast}</div>}
    </main>
  );
}
