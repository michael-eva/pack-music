import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { dbToLinear } from "@/lib/loudness";
import { getTrackSources, type ListenTrack } from "@/lib/listener.functions";
import {
  cycleRepeat,
  identityOrder,
  isStale,
  nextPos,
  prevPos,
  shuffledOrder,
  type Repeat,
} from "./queue";

/**
 * The listener's player. One <audio> element routed through a shared Web
 * Audio graph, so each track gets its levelling gain (PLY-3) and boosts above
 * 1.0 are possible. Media Session wires up lock-screen and media keys (PLY-7).
 * The queue, position and settings survive a reload via localStorage.
 */

type Source = { url: string; gainDb: number; fetchedAt: number };

type Saved = {
  tracks: ListenTrack[];
  order: number[];
  pos: number;
  time: number;
  repeat: Repeat;
  shuffle: boolean;
};

const STORAGE_KEY = "pack.player.v1";

export type PlayerApi = {
  tracks: ListenTrack[];
  upNext: ListenTrack[];
  current: ListenTrack | null;
  playing: boolean;
  loading: boolean;
  time: number;
  duration: number;
  repeat: Repeat;
  shuffle: boolean;
  error: string | null;
  play: (tracks: ListenTrack[], startIndex?: number, options?: { shuffle?: boolean }) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  jumpTo: (trackId: string) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  expanded: boolean;
  setExpanded: (open: boolean) => void;
};

const PlayerContext = createContext<PlayerApi | null>(null);

export function usePlayer(): PlayerApi {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return value;
}

function readSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    if (!Array.isArray(saved.tracks) || !Array.isArray(saved.order)) return null;
    return saved;
  } catch {
    return null;
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<ListenTrack[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [repeat, setRepeat] = useState<Repeat>("off");
  const [shuffle, setShuffle] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const graphRef = useRef<{ context: AudioContext; gain: GainNode } | null>(null);
  const sourcesRef = useRef(new Map<string, Source>());
  const loadedRef = useRef<string | null>(null); // track id currently in the <audio> src
  const resumeAtRef = useRef(0);
  const stateRef = useRef({ tracks, order, pos, repeat, shuffle });
  stateRef.current = { tracks, order, pos, repeat, shuffle };

  const current = tracks[order[pos] ?? -1] ?? null;

  // --- audio element and Web Audio graph ----------------------------------

  function audio(): HTMLAudioElement {
    if (!audioRef.current) {
      const el = new Audio();
      el.crossOrigin = "anonymous";
      el.preload = "auto";
      audioRef.current = el;
    }
    return audioRef.current;
  }

  /** Must run inside a user gesture the first time (autoplay rules). */
  function graph() {
    if (!graphRef.current) {
      const context = new AudioContext();
      const gain = context.createGain();
      context.createMediaElementSource(audio()).connect(gain).connect(context.destination);
      graphRef.current = { context, gain };
    }
    void graphRef.current.context.resume();
    return graphRef.current;
  }

  async function sourcesFor(ids: string[]): Promise<void> {
    const missing = ids.filter((id) => {
      const s = sourcesRef.current.get(id);
      return !s || isStale(s.fetchedAt);
    });
    if (!missing.length) return;
    const rows = await getTrackSources({ data: { trackIds: [...new Set(missing)].slice(0, 200) } });
    const now = Date.now();
    for (const r of rows)
      sourcesRef.current.set(r.trackId, { url: r.url, gainDb: r.gainDb, fetchedAt: now });
  }

  const load = useCallback(async (atPos: number, autoplay: boolean, startAt = 0) => {
    const { tracks: list, order: ord, repeat: rep } = stateRef.current;
    const track = list[ord[atPos] ?? -1];
    if (!track) return;
    const following = nextPos({ length: list.length, order: ord, pos: atPos, repeat: rep }, false);
    const nextTrack = following == null ? null : list[ord[following] ?? -1];
    setLoading(true);
    setError(null);
    try {
      if (autoplay) graph();
      await sourcesFor([track.id, ...(nextTrack ? [nextTrack.id] : [])]);
      const source = sourcesRef.current.get(track.id);
      if (!source) throw new Error("This song isn't available right now.");
      const el = audio();
      if (loadedRef.current !== track.id) {
        el.src = source.url;
        loadedRef.current = track.id;
        el.currentTime = startAt;
      }
      if (graphRef.current) graphRef.current.gain.gain.value = dbToLinear(source.gainDb);
      if (autoplay) await el.play();

      // Warm the browser cache for the next song so the change is quick.
      const nextSource = nextTrack ? sourcesRef.current.get(nextTrack.id) : null;
      if (nextSource) {
        if (!preloadRef.current) {
          preloadRef.current = new Audio();
          preloadRef.current.preload = "auto";
          preloadRef.current.muted = true;
        }
        if (preloadRef.current.src !== nextSource.url) preloadRef.current.src = nextSource.url;
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setError(e instanceof Error ? e.message : "Couldn't play this song.");
        setPlaying(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // --- events ---------------------------------------------------------------

  const advance = useCallback(
    (auto: boolean) => {
      const s = stateRef.current;
      const n = nextPos(
        { length: s.tracks.length, order: s.order, pos: s.pos, repeat: s.repeat },
        auto,
      );
      if (n == null) {
        setPlaying(false);
        audio().pause();
        audio().currentTime = 0;
        return;
      }
      if (n === s.pos) {
        audio().currentTime = 0;
        void audio().play();
        return;
      }
      setPos(n);
      stateRef.current = { ...s, pos: n };
      void load(n, auto ? true : !audio().paused || playingRef.current);
    },
    [load],
  );
  const playingRef = useRef(false);
  playingRef.current = playing;

  useEffect(() => {
    const el = audio();
    const onTime = () => setTime(el.currentTime);
    const onMeta = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => advance(true);
    const onError = () => {
      // Usually an expired link: drop it and try once more.
      const id = loadedRef.current;
      if (id && sourcesRef.current.has(id)) {
        sourcesRef.current.delete(id);
        loadedRef.current = null;
        void load(stateRef.current.pos, playingRef.current, el.currentTime || 0);
      } else {
        setError("Couldn't play this song.");
      }
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
    };
  }, [advance, load]);

  // Restore the last session, paused (the browser needs a tap before playing).
  useEffect(() => {
    const saved = readSaved();
    if (!saved || !saved.tracks.length) return;
    setTracks(saved.tracks);
    setOrder(
      saved.order.length === saved.tracks.length ? saved.order : identityOrder(saved.tracks.length),
    );
    setPos(Math.min(saved.pos, saved.tracks.length - 1));
    setRepeat(saved.repeat ?? "off");
    setShuffle(!!saved.shuffle);
    setTime(saved.time ?? 0);
    resumeAtRef.current = saved.time ?? 0;
    const track = saved.tracks[saved.order[saved.pos] ?? 0];
    if (track) setDuration(track.durationMs / 1000);
  }, []);

  // Remember the queue and position.
  const lastSaveRef = useRef(0);
  useEffect(() => {
    if (!tracks.length) return;
    const now = Date.now();
    if (playing && now - lastSaveRef.current < 4000) return;
    lastSaveRef.current = now;
    try {
      const saved: Saved = { tracks, order, pos, time, repeat, shuffle };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // Storage full or blocked: the player still works, it just won't remember.
    }
  }, [tracks, order, pos, time, repeat, shuffle, playing]);

  // --- controls -------------------------------------------------------------

  const play = useCallback(
    (list: ListenTrack[], startIndex = 0, options?: { shuffle?: boolean }) => {
      if (!list.length) return;
      const start = Math.max(0, Math.min(startIndex, list.length - 1));
      const useShuffle = options?.shuffle ?? false;
      const ord = useShuffle
        ? shuffledOrder(
            list.length,
            options?.shuffle ? Math.floor(Math.random() * list.length) : start,
          )
        : identityOrder(list.length);
      const p = useShuffle ? 0 : start;
      setTracks(list);
      setOrder(ord);
      setPos(p);
      setShuffle(useShuffle);
      setTime(0);
      loadedRef.current = null;
      stateRef.current = {
        ...stateRef.current,
        tracks: list,
        order: ord,
        pos: p,
        shuffle: useShuffle,
      };
      void load(p, true, 0);
    },
    [load],
  );

  const toggle = useCallback(() => {
    const el = audio();
    if (!stateRef.current.tracks.length) return;
    if (el.paused) {
      if (loadedRef.current) {
        graph();
        void el.play();
      } else {
        void load(stateRef.current.pos, true, resumeAtRef.current);
        resumeAtRef.current = 0;
      }
    } else {
      el.pause();
    }
  }, [load]);

  const next = useCallback(() => advance(false), [advance]);

  const prev = useCallback(() => {
    const s = stateRef.current;
    const el = audio();
    const p = prevPos(
      { length: s.tracks.length, order: s.order, pos: s.pos, repeat: s.repeat },
      el.currentTime,
    );
    if (p === s.pos) {
      el.currentTime = 0;
      return;
    }
    setPos(p);
    stateRef.current = { ...s, pos: p };
    void load(p, !el.paused);
  }, [load]);

  const seek = useCallback((seconds: number) => {
    const el = audio();
    if (loadedRef.current) el.currentTime = seconds;
    else resumeAtRef.current = seconds;
    setTime(seconds);
  }, []);

  const jumpTo = useCallback(
    (trackId: string) => {
      const s = stateRef.current;
      const p = s.order.findIndex((i) => s.tracks[i]?.id === trackId);
      if (p < 0) return;
      setPos(p);
      stateRef.current = { ...s, pos: p };
      void load(p, true, 0);
    },
    [load],
  );

  const toggleShuffle = useCallback(() => {
    const s = stateRef.current;
    const currentIndex = s.order[s.pos] ?? 0;
    const ord = s.shuffle
      ? identityOrder(s.tracks.length)
      : shuffledOrder(s.tracks.length, currentIndex);
    const p = ord.indexOf(currentIndex);
    setOrder(ord);
    setPos(Math.max(0, p));
    setShuffle(!s.shuffle);
    stateRef.current = { ...s, order: ord, pos: Math.max(0, p), shuffle: !s.shuffle };
  }, []);

  const onCycleRepeat = useCallback(() => setRepeat((r) => cycleRepeat(r)), []);

  // --- Media Session (lock screen, headphones, media keys) ------------------

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: current.releaseTitle,
      artwork: current.artworkUrl ? [{ src: current.artworkUrl, sizes: "512x512" }] : [],
    });
  }, [current]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.playbackState = playing ? "playing" : "paused";
    ms.setActionHandler("play", () => toggle());
    ms.setActionHandler("pause", () => audio().pause());
    ms.setActionHandler("nexttrack", () => next());
    ms.setActionHandler("previoustrack", () => prev());
    ms.setActionHandler("seekto", (d) => d.seekTime != null && seek(d.seekTime));
  }, [playing, toggle, next, prev, seek]);

  const upNext = useMemo(() => {
    const out: ListenTrack[] = [];
    for (let i = pos + 1; i < order.length && out.length < 20; i++) {
      const t = tracks[order[i]!];
      if (t) out.push(t);
    }
    return out;
  }, [tracks, order, pos]);

  const value: PlayerApi = {
    tracks,
    upNext,
    current,
    playing,
    loading,
    time,
    duration: duration || (current ? current.durationMs / 1000 : 0),
    repeat,
    shuffle,
    error,
    play,
    toggle,
    next,
    prev,
    seek,
    jumpTo,
    toggleShuffle,
    cycleRepeat: onCycleRepeat,
    expanded,
    setExpanded,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
