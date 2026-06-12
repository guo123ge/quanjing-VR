"use client";

import { Maximize2, Navigation, Share2 } from "lucide-react";
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
    return <main className="grid min-h-screen place-items-center bg-midnight text-white">暂无可展示场景</main>;
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <img src={current.imageUrl} alt={current.name} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-midnight/70 via-midnight/10 to-midnight/55" />
      <header className="absolute left-4 right-4 top-4 z-20 flex justify-between gap-4 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 shadow-glass backdrop-blur-xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">{project.brandName}</p>
          <h1 className="mt-1 text-2xl font-semibold drop-shadow">{project.title}</h1>
        </div>
        <div className="hidden text-right text-sm text-white/85 sm:block">
          <p className="text-xs uppercase tracking-wide text-white/50">Current scene</p>
          <p className="mt-1 font-semibold">{current.name}</p>
        </div>
      </header>
      <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-4">
        <button onClick={fullscreen} className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/15 backdrop-blur-xl transition hover:bg-white/25">
          <Maximize2 size={22} />
        </button>
        <button onClick={share} className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/15 backdrop-blur-xl transition hover:bg-white/25">
          <Share2 size={22} />
        </button>
      </div>
      {current.hotspots.map((hotspot, index) => (
        <button
          key={hotspot.id}
          onClick={() => setCurrentId(hotspot.targetSceneId)}
          className="absolute z-20 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/90 px-4 py-2 text-sm font-semibold text-midnight shadow-interactive transition hover:scale-105"
          style={{ left: `${index % 2 === 0 ? 64 : 34}%`, top: `${index % 2 === 0 ? 55 : 66}%` }}
        >
          <Navigation size={15} />
          {hotspot.label}
        </button>
      ))}
      <nav className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 shadow-glass backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => setCurrentId(scene.id)}
              className={`relative h-24 w-32 flex-none overflow-hidden rounded-xl border-2 transition ${
                scene.id === current.id ? "border-aiPurple shadow-interactive" : "border-white/10 opacity-80 hover:opacity-100"
              }`}
            >
              <img src={scene.thumbnailUrl} alt={scene.name} className="h-full w-full object-cover" />
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-1 text-xs">{scene.name}</span>
            </button>
          ))}
        </div>
      </nav>
      {toast && <div className="absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-full bg-midnight/85 px-4 py-2 text-sm shadow-glass">{toast}</div>}
    </main>
  );
}
