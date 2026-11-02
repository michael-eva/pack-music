import { useEffect, useRef, useState } from "react";
import { dbToLinear } from "@/lib/loudness";

/**
 * Plays a track with the same loudness levelling a business hears (CUR-4).
 * Uses Web Audio so gain can go above 1. Only one preview plays at a time.
 */
let stopCurrent: (() => void) | null = null;

export function LevelledPreview({ url, gainDb, label = "Preview" }: { url: string | null; gainDb: number; label?: string }) {
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const ctx = useRef<{ context: AudioContext; gain: GainNode } | null>(null);

  useEffect(() => () => stop(), []);
  useEffect(() => {
    if (ctx.current) ctx.current.gain.gain.value = dbToLinear(gainDb);
  }, [gainDb]);

  function stop() {
    audio.current?.pause();
    setPlaying(false);
  }

  async function play() {
    if (!url) return;
    stopCurrent?.();
    if (!audio.current) {
      const el = new Audio();
      el.crossOrigin = "anonymous";
      el.src = url;
      el.onended = () => setPlaying(false);
      const context = new AudioContext();
      const gain = context.createGain();
      context.createMediaElementSource(el).connect(gain).connect(context.destination);
      audio.current = el;
      ctx.current = { context, gain };
    }
    ctx.current!.gain.gain.value = dbToLinear(gainDb);
    await ctx.current!.context.resume();
    await audio.current.play();
    stopCurrent = stop;
    setPlaying(true);
  }

  return (
    <button
      type="button"
      disabled={!url}
      onClick={() => (playing ? stop() : play())}
      aria-label={`${playing ? "Stop" : label}, levelled ${gainDb > 0 ? "+" : ""}${gainDb} dB`}
      className="press inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full bg-ink px-3 text-xs font-bold uppercase tracking-widest text-paper disabled:opacity-40"
    >
      {playing ? "■" : "▶"}
      <span className="font-mono text-[0.65rem] text-cyan">{gainDb > 0 ? "+" : ""}{gainDb} dB</span>
    </button>
  );
}
