import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { PackLogo } from "@/components/site/PackLogo";
import { Stanley } from "@/components/site/blocks";
import { stanley } from "@/components/site/stanley";
import { Loading, OnAir, formatDuration } from "@/components/app/ui";
import { dbToLinear } from "@/lib/loudness";
import {
  addListened,
  dropSent,
  mergeEvents,
  parseQueue,
  upNext,
  type PlayEvent,
} from "@/lib/player-queue";
import {
  SKIP_REASONS,
  getPlayerQueue,
  heartbeat,
  recordPlays,
  recordSkip,
  setTrim,
  stopPlayer,
  type PlayerQueue,
  type PlayerTrack,
} from "@/lib/player.functions";
import { useCurrentSite } from "./business";
import { useQrDataUrl } from "./business.index";

export const Route = createFileRoute("/business/player")({
  head: () => ({ meta: [{ title: "Player · The Pack" }] }),
  component: PlayerPage,
});

const HEARTBEAT_MS = 30_000;
const FLUSH_MS = 15_000;

/** B3: the business player. Built to be hard to ignore and easy to leave running (VEN-2 to VEN-6). */
function PlayerPage() {
  const { site, isPending } = useCurrentSite();
  if (isPending)
    return (
      <div className="min-h-screen bg-ink">
        <Loading />
      </div>
    );
  if (!site) return null;
  return <Player key={site.id} siteId={site.id} />;
}

type Deck = { el: HTMLAudioElement; gain: GainNode; track: PlayerTrack | null };
type Saved = { trackId: string; position: number; playing: boolean };

const stateKey = (siteId: string) => `pack.player.state.${siteId}`;
const eventsKey = (siteId: string) => `pack.player.events.${siteId}`;

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage full or blocked: playback carries on, events stay in memory
  }
}

function Player({ siteId }: { siteId: string }) {
  const [queue, setQueue] = useState<PlayerQueue | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState<PlayerTrack | null>(null);
  const [position, setPosition] = useState(0);
  const [trimDb, setTrimDb] = useState(0);
  const [healthy, setHealthy] = useState(true);
  const [pendingEvents, setPendingEvents] = useState(0);
  const [resumeFrom] = useState<Saved | null>(() => {
    const raw = readStorage(stateKey(siteId));
    try {
      return raw ? (JSON.parse(raw) as Saved) : null;
    } catch {
      return null;
    }
  });

  const ctx = useRef<{ context: AudioContext; master: GainNode } | null>(null);
  const decks = useRef<Deck[]>([]);
  const active = useRef(0);
  const queueRef = useRef<PlayerQueue | null>(null);
  const play = useRef<{
    eventId: string;
    startedAt: string;
    listened: number;
    lastTime: number;
  } | null>(null);
  const events = useRef<PlayEvent[]>(parseQueue(readStorage(eventsKey(siteId))));
  const flushing = useRef(false);
  const advancing = useRef(false);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      const q = await getPlayerQueue({ data: { siteId } });
      queueRef.current = q;
      setQueue(q);
      setLoadError(null);
      return q;
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Couldn't load the playlist.");
      return queueRef.current;
    }
  }, [siteId]);

  useEffect(() => {
    loadQueue().then((q) => {
      if (q) setTrimDb(q.site.trimDb);
    });
  }, [loadQueue]);

  // ---- play events: queued locally, flushed in batches, never lost (PLY-5, PAY-1) ----
  const flush = useCallback(async () => {
    if (flushing.current || !events.current.length) return;
    flushing.current = true;
    try {
      const batch = events.current.slice(0, 200);
      const { accepted } = await recordPlays({ data: { events: batch } });
      events.current = dropSent(events.current, accepted);
      writeStorage(eventsKey(siteId), JSON.stringify(events.current));
    } catch {
      // offline: try again on the next tick or when the network returns
    } finally {
      flushing.current = false;
      setPendingEvents(events.current.length);
    }
  }, [siteId]);

  const finishPlay = useCallback(() => {
    const deck = decks.current[active.current];
    const p = play.current;
    if (!deck?.track || !p) return;
    play.current = null;
    events.current = mergeEvents(events.current, [
      {
        id: p.eventId,
        siteId,
        trackId: deck.track.trackId,
        playlistVersionId: queueRef.current?.playlist?.versionId ?? null,
        startedAt: p.startedAt,
        secondsPlayed: Math.round(p.listened),
      },
    ]);
    writeStorage(eventsKey(siteId), JSON.stringify(events.current));
    setPendingEvents(events.current.length);
    void flush();
  }, [flush, siteId]);

  useEffect(() => {
    const id = window.setInterval(flush, FLUSH_MS);
    window.addEventListener("online", flush);
    void flush();
    return () => {
      window.clearInterval(id);
      window.removeEventListener("online", flush);
    };
  }, [flush]);

  // ---- heartbeat: ON AIR in Admin and on the listener page (VEN-5) ----
  const beat = useCallback(
    async (trackStarted?: { trackId: string; startedAt: string }) => {
      try {
        await heartbeat({
          data: {
            siteId,
            ...(trackStarted
              ? {
                  trackStarted: {
                    ...trackStarted,
                    playlistVersionId: queueRef.current?.playlist?.versionId ?? null,
                  },
                }
              : {}),
          },
        });
        setHealthy(true);
      } catch {
        setHealthy(false);
      }
    },
    [siteId],
  );

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => beat(), HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [playing, beat]);

  // ---- audio graph: two decks, each levelled, through one trim (PLY-3, VEN-4) ----
  function ensureAudio() {
    if (ctx.current) return;
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = dbToLinear(trimDb);
    master.connect(context.destination);
    ctx.current = { context, master };
    decks.current = [0, 1].map((n) => {
      const el = new Audio();
      el.crossOrigin = "anonymous";
      el.preload = "auto";
      const gain = context.createGain();
      context.createMediaElementSource(el).connect(gain).connect(master);
      const deck: Deck = { el, gain, track: null };
      el.addEventListener("timeupdate", () => {
        if (active.current !== n || !play.current) return;
        play.current.listened = addListened(
          play.current.listened,
          play.current.lastTime,
          el.currentTime,
        );
        play.current.lastTime = el.currentTime;
        setPosition(el.currentTime);
        writeStorage(
          stateKey(siteId),
          JSON.stringify({ trackId: deck.track?.trackId, position: el.currentTime, playing: true }),
        );
      });
      el.addEventListener("ended", () => {
        if (active.current === n) void advance();
      });
      el.addEventListener("error", () => {
        // An expired link or a missing file: move on rather than go silent.
        if (active.current === n) window.setTimeout(() => void advance(), 1500);
      });
      return deck;
    });
  }

  useEffect(() => {
    if (ctx.current) ctx.current.master.gain.value = dbToLinear(trimDb);
  }, [trimDb]);

  function load(deck: Deck, track: PlayerTrack) {
    deck.track = track;
    deck.gain.gain.value = dbToLinear(track.gainDb);
    if (track.url && deck.el.src !== track.url) {
      deck.el.src = track.url;
      deck.el.load();
    }
  }

  async function startTrack(track: PlayerTrack, at = 0) {
    const deck = decks.current[active.current]!;
    if (deck.track?.trackId !== track.trackId || !deck.el.src) load(deck, track);
    if (at > 0) deck.el.currentTime = at;
    play.current = {
      eventId: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      listened: 0,
      lastTime: deck.el.currentTime,
    };
    setCurrent(track);
    setPosition(at);
    try {
      await deck.el.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
    void beat({ trackId: track.trackId, startedAt: play.current.startedAt });
    mediaSession(track);
    preloadNext(track);
  }

  function preloadNext(after: PlayerTrack) {
    const q = queueRef.current;
    if (!q) return;
    const [next] = upNext(q.tracks, after.trackId, 1);
    const other = decks.current[1 - active.current];
    if (next && other && next.trackId !== after.trackId) load(other, next);
  }

  /** At each track boundary: refetch, so reassignments and takedowns apply now (CUR-3, RTS-4). */
  async function advance() {
    if (advancing.current) return;
    advancing.current = true;
    try {
      const was = decks.current[active.current]!;
      finishPlay();
      was.el.pause();
      const q = await loadQueue();
      if (!q || !q.tracks.length) {
        setCurrent(null);
        setPlaying(false);
        return;
      }
      const [next] = upNext(q.tracks, was.track?.trackId ?? null, 1);
      if (!next) return;
      const other = decks.current[1 - active.current]!;
      if (other.track?.trackId === next.trackId && other.el.src) {
        other.track = next; // fresh link and levelling from the refetch
        other.gain.gain.value = dbToLinear(next.gainDb);
        active.current = 1 - active.current;
      } else {
        load(was, next);
      }
      was.el.currentTime = 0;
      await startTrack(next);
    } finally {
      advancing.current = false;
    }
  }

  async function start() {
    ensureAudio();
    await ctx.current!.context.resume();
    setStarted(true);
    void requestWakeLock();
    const q = queueRef.current ?? (await loadQueue());
    if (!q?.tracks.length) return;
    const resumeTrack = resumeFrom
      ? q.tracks.find((t) => t.trackId === resumeFrom.trackId)
      : undefined;
    if (current) {
      // paused, not stopped: carry on where we were
      const deck = decks.current[active.current]!;
      await deck.el.play().catch(() => undefined);
      setPlaying(!deck.el.paused);
      void beat();
      return;
    }
    await startTrack(resumeTrack ?? q.tracks[0]!, resumeTrack ? resumeFrom!.position : 0);
  }

  async function pause() {
    const deck = decks.current[active.current];
    deck?.el.pause();
    setPlaying(false);
    writeStorage(
      stateKey(siteId),
      JSON.stringify({ trackId: current?.trackId, position, playing: false }),
    );
    await stopPlayer({ data: { siteId } }).catch(() => undefined);
  }

  async function skip(reason: (typeof SKIP_REASONS)[number]) {
    if (!current) return;
    const trackId = current.trackId;
    void recordSkip({ data: { siteId, trackId, reason } }).catch(() => undefined);
    await advance();
  }

  async function requestWakeLock() {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
      };
      wakeLock.current = (await nav.wakeLock?.request("screen")) ?? null;
    } catch {
      wakeLock.current = null;
    }
  }

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && started) void requestWakeLock();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void wakeLock.current?.release().catch(() => undefined);
    };
  }, [started]);

  useEffect(
    () => () => {
      decks.current.forEach((d) => d.el.pause());
      void ctx.current?.context.close();
    },
    [],
  );

  // ---- trim: saved per site, applied live ----
  const trimTimer = useRef<number | undefined>(undefined);
  function changeTrim(value: number) {
    setTrimDb(value);
    window.clearTimeout(trimTimer.current);
    trimTimer.current = window.setTimeout(() => {
      void setTrim({ data: { siteId, trimDb: value } }).catch(() => undefined);
    }, 600);
  }

  const shortLink = queue ? `${window.location.origin}/c/${queue.site.shortCode}` : null;
  const qr = useQrDataUrl(shortLink);

  if (!queue && !loadError)
    return (
      <div className="min-h-screen bg-ink">
        <Loading />
      </div>
    );
  const next = queue ? upNext(queue.tracks, current?.trackId ?? null, 2) : [];
  const state = playing && healthy ? "on_air" : started ? "quiet" : "offline";
  const duration = current ? current.durationMs / 1000 : 0;

  return (
    <div className="flex min-h-screen flex-col bg-ink text-paper">
      <header className="flex flex-wrap items-center gap-4 border-b border-paper/15 px-6 py-4">
        <PackLogo variant="full" className="h-10 text-magenta" />
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-bold uppercase">
            {queue?.site.businessName}
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-paper/60">
            {queue?.site.region}
          </p>
        </div>
        <OnAir state={state} />
        {queue?.playlist ? (
          <p className="ml-auto font-mono text-xs uppercase tracking-[0.15em] text-paper/70">
            {queue.playlist.name} · v{queue.playlist.version}
          </p>
        ) : null}
        <Link
          to="/business"
          className="font-mono text-xs uppercase tracking-[0.2em] text-paper/60 hover:text-yellow"
        >
          Exit
        </Link>
      </header>

      {loadError ? <p className="bg-pink px-6 py-2 text-sm font-bold">{loadError}</p> : null}

      <main className="grid flex-1 gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {!queue?.tracks.length ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Stanley src={stanley.listening} className="h-28 w-auto invert" />
            <p className="font-display text-3xl font-bold uppercase">No playlist assigned yet</p>
            <p className="max-w-md text-paper/70">
              A Pack curator will assign a playlist to this site. This screen picks it up on its
              own.
            </p>
          </div>
        ) : !started ? (
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <button
              type="button"
              onClick={start}
              className="press flex h-56 w-56 flex-col items-center justify-center rounded-full bg-pink text-paper shadow-[0_0_0_10px_var(--ink),0_0_0_14px_var(--pink)]"
            >
              <span className="text-6xl">▶</span>
              <span className="mt-2 font-display text-2xl font-bold uppercase">
                {resumeFrom?.playing ? "Tap to resume" : "Start"}
              </span>
            </button>
            <p className="max-w-md text-paper/70">
              {resumeFrom?.playing
                ? "The player was reloaded. Browsers need one tap before they'll play sound, then it carries on where it left off."
                : "One tap and The Pack plays for your pilot hours. Keep this screen open."}
            </p>
          </div>
        ) : current ? (
          <section className="flex flex-col gap-8 md:flex-row md:items-center">
            {current.artworkUrl ? (
              <img
                src={current.artworkUrl}
                alt=""
                className="aspect-square w-full max-w-sm rounded-2xl border-4 border-paper object-cover md:w-80"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="mono-kicker text-cyan">Now playing</p>
              <h1 className="mt-2 text-5xl leading-none text-paper xl:text-7xl">{current.title}</h1>
              <p className="mt-3 text-2xl">
                {current.artist}
                {current.artistRegion ? (
                  <span className="text-paper/60"> · {current.artistRegion}</span>
                ) : null}
              </p>
              {queue.playlist ? (
                <p className="mt-2 font-mono text-sm uppercase tracking-[0.15em] text-yellow">
                  Curated by {queue.playlist.curatedBy}
                </p>
              ) : null}

              <div className="mt-6">
                <div className="h-2 overflow-hidden rounded-full bg-paper/20">
                  <div
                    className="h-full bg-cyan"
                    style={{
                      width: `${duration ? Math.min(100, (position / duration) * 100) : 0}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between font-mono text-xs text-paper/60">
                  <span>{formatDuration(position * 1000)}</span>
                  <span>{formatDuration(current.durationMs)}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => (playing ? pause() : start())}
                  className="press rounded-full bg-paper px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
                >
                  {playing ? "Pause" : "Play"}
                </button>
                {SKIP_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => skip(reason)}
                    className="press rounded-full border-2 border-paper px-5 py-3 text-sm font-bold uppercase tracking-widest"
                  >
                    Skip · {reason}
                  </button>
                ))}
              </div>

              <label className="mt-6 block max-w-md">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-paper/70">
                  Volume trim {trimDb > 0 ? "+" : ""}
                  {trimDb} dB · levelling stays on
                </span>
                <input
                  type="range"
                  min={-6}
                  max={6}
                  step={0.5}
                  value={trimDb}
                  onChange={(e) => changeTrim(Number(e.target.value))}
                  className="mt-2 w-full accent-magenta"
                />
              </label>
            </div>
          </section>
        ) : (
          <Loading />
        )}

        <aside className="space-y-6">
          <div className="rounded-2xl border-2 border-paper/30 p-4">
            <p className="mono-kicker text-paper/60">Up next (ready to play)</p>
            <ul className="mt-3 space-y-2">
              {next.map((t, i) => (
                <li key={`${t.trackId}-${i}`} className="text-sm">
                  <span className="font-bold">{t.title}</span> · {t.artist}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-paper p-4 text-ink">
            {qr ? <img src={qr} alt="QR code to see what's playing" className="h-28 w-28" /> : null}
            <div>
              <p className="text-sm font-bold">Scan to see what's playing here</p>
              <p className="mt-1 break-all font-mono text-xs">
                {shortLink?.replace(/^https?:\/\//, "")}
              </p>
            </div>
          </div>
          {pendingEvents > 0 ? (
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-yellow">
              {pendingEvents} plays waiting to sync
            </p>
          ) : null}
        </aside>
      </main>

      <footer className="border-t border-paper/15 px-6 py-3 text-sm">
        Keep your OneMusic licence.{" "}
        <Link to="/business/notice" className="underline">
          Read the licensing notice
        </Link>
      </footer>
    </div>
  );
}

/** PLY-7: title, artist and artwork on lock screens and media keys. */
function mediaSession(track: PlayerTrack) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.releaseTitle,
    artwork: track.artworkUrl
      ? [{ src: track.artworkUrl, sizes: "512x512", type: "image/jpeg" }]
      : [],
  });
}
