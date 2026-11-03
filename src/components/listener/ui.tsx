import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  Heart,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import type { ListenTrack, PlaylistCard, ReleaseCard } from "@/lib/listener.functions";
import { formatDuration } from "@/components/app/ui";
import { PackLogo } from "@/components/site/PackLogo";
import { usePlayer } from "./player";
import { useSaves } from "./saves";

/*
 * Listener app pieces, in the brand: paper-on-gradient, hard ink borders and
 * shadows, Fredoka headings and mono kickers.
 */

export function Cover({
  src,
  alt = "",
  className = "",
  round = false,
}: {
  src: string | null;
  alt?: string;
  className?: string;
  round?: boolean;
}) {
  const shape = round ? "rounded-full" : "rounded-md";
  return src ? (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`aspect-square w-full border-2 border-ink object-cover ${shape} ${className}`}
    />
  ) : (
    <div
      aria-hidden="true"
      className={`grad-pink-orange flex aspect-square w-full items-center justify-center border-2 border-ink ${shape} ${className}`}
    >
      <PackLogo variant="mark" className="h-1/3 text-paper" />
    </div>
  );
}

export function Section({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      {kicker ? <p className="mono-kicker text-yellow">{kicker}</p> : null}
      <h2 className="mt-1 text-3xl sm:text-4xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** A row that scrolls sideways on phones and wraps into a grid on wide screens. */
export function Shelf({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {children}
    </div>
  );
}

export function PlaylistTile({ playlist }: { playlist: PlaylistCard }) {
  return (
    <Link
      to="/listen/playlist/$id"
      params={{ id: playlist.id }}
      className="group w-40 shrink-0 snap-start sm:w-auto"
    >
      <Cover
        src={playlist.coverUrl}
        className="shadow-[4px_4px_0_0_var(--ink)] transition-transform group-hover:-translate-y-0.5"
      />
      <p className="mt-2 font-display text-lg font-bold uppercase leading-tight">{playlist.name}</p>
      <p className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-paper/80">
        Curated by {playlist.curatedBy}
      </p>
    </Link>
  );
}

const TYPE_LABEL = { single: "Single", ep: "EP", album: "Album" } as const;

export function ReleaseTile({
  release,
  showArtist = true,
}: {
  release: ReleaseCard;
  showArtist?: boolean;
}) {
  return (
    <Link
      to="/listen/release/$id"
      params={{ id: release.id }}
      className="group w-36 shrink-0 snap-start sm:w-auto"
    >
      <Cover
        src={release.artworkUrl}
        className="shadow-[4px_4px_0_0_var(--ink)] transition-transform group-hover:-translate-y-0.5"
      />
      <p className="mt-2 truncate font-bold">{release.title}</p>
      <p className="truncate text-sm text-paper/80">
        {showArtist ? `${release.artist} · ` : ""}
        {TYPE_LABEL[release.type]}
        {release.year ? ` · ${release.year}` : ""}
      </p>
    </Link>
  );
}

export function ArtistChip({
  artist,
}: {
  artist: { id: string; name: string; imageUrl: string | null; region?: string | null };
}) {
  return (
    <Link
      to="/listen/artist/$id"
      params={{ id: artist.id }}
      className="flex items-center gap-3 rounded-full border-2 border-ink bg-paper py-1.5 pl-1.5 pr-4 text-ink shadow-[3px_3px_0_0_var(--ink)] hover:bg-yellow"
    >
      <span className="w-9 shrink-0">
        <Cover src={artist.imageUrl} round />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{artist.name}</span>
        {artist.region ? (
          <span className="block truncate text-xs text-ink/60">{artist.region}</span>
        ) : null}
      </span>
    </Link>
  );
}

export function SaveHeart({ trackId, className = "" }: { trackId: string; className?: string }) {
  const saves = useSaves();
  const saved = saves.isSaved(trackId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        saves.toggle(trackId);
      }}
      aria-pressed={saved}
      aria-label={saved ? "Remove from Saved" : "Save this song"}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-paper/15 ${className}`}
    >
      <Heart className={`h-5 w-5 ${saved ? "fill-pink text-pink" : ""}`} />
    </button>
  );
}

export function PlayControls({
  onPlay,
  onShuffle,
  disabled,
}: {
  onPlay: () => void;
  onShuffle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={onPlay}
        className="press inline-flex items-center gap-2 rounded-full bg-yellow px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-50"
      >
        <Play className="h-5 w-5 fill-ink" /> Play
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onShuffle}
        className="press inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-50"
      >
        <Shuffle className="h-4 w-4" /> Shuffle
      </button>
    </div>
  );
}

function Bars() {
  return (
    <span aria-label="Playing" className="inline-flex h-4 items-end gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 animate-pulse rounded-sm bg-green"
          style={{ height: `${50 + i * 20}%`, animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

/** A tappable list of songs. Tapping a row plays the list from that song. */
export function TrackList({
  tracks,
  showArtwork = true,
  numbered = false,
  onRemove,
}: {
  tracks: ListenTrack[];
  showArtwork?: boolean;
  numbered?: boolean;
  onRemove?: (trackId: string) => void;
}) {
  const player = usePlayer();
  return (
    <ol className="overflow-hidden rounded-md border-2 border-ink bg-ink/35">
      {tracks.map((t, i) => {
        const isCurrent = player.current?.id === t.id;
        return (
          <li key={`${t.id}-${i}`} className="border-b border-paper/15 last:border-b-0">
            <div
              className={`flex items-center gap-3 px-3 py-2 ${isCurrent ? "bg-paper/15" : "hover:bg-paper/10"}`}
            >
              <button
                type="button"
                onClick={() => player.play(tracks, i)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                aria-label={`Play ${t.title} by ${t.artist}`}
              >
                {numbered ? (
                  <span className="w-6 shrink-0 text-center font-mono text-sm text-paper/70">
                    {isCurrent && player.playing ? <Bars /> : i + 1}
                  </span>
                ) : null}
                {showArtwork ? (
                  <span className="w-11 shrink-0">
                    <Cover src={t.artworkUrl} className="rounded-sm border" />
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span
                    className={`flex items-center gap-2 truncate font-bold ${isCurrent ? "text-yellow" : ""}`}
                  >
                    <span className="truncate">{t.title}</span>
                    {t.explicit ? (
                      <span
                        className="rounded border border-current px-1 font-mono text-[0.6rem] leading-4"
                        title="Explicit"
                      >
                        E
                      </span>
                    ) : null}
                    {!numbered && isCurrent && player.playing ? <Bars /> : null}
                  </span>
                  <span className="block truncate text-sm text-paper/75">{t.artist}</span>
                </span>
              </button>
              <span className="hidden font-mono text-xs text-paper/70 sm:inline">
                {formatDuration(t.durationMs)}
              </span>
              {onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(t.id)}
                  className="rounded-full px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-paper/70 hover:bg-paper/15"
                >
                  Remove
                </button>
              ) : (
                <SaveHeart trackId={t.id} />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ProgressBar({ className = "" }: { className?: string }) {
  const { time, duration } = usePlayer();
  const pct = duration ? Math.min(100, (time / duration) * 100) : 0;
  return (
    <div className={`h-1 w-full bg-paper/20 ${className}`}>
      <div className="h-full bg-cyan" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Sits above the bottom nav whenever something is queued. */
export function MiniPlayer() {
  const player = usePlayer();
  const t = player.current;
  if (!t) return null;
  return (
    <div className="border-t-2 border-ink bg-ink text-paper">
      <ProgressBar />
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2">
        <button
          type="button"
          onClick={() => player.setExpanded(true)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label="Open now playing"
        >
          <span className="w-11 shrink-0">
            <Cover src={t.artworkUrl} className="rounded-sm border-paper/30" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-bold">{t.title}</span>
            <span className="block truncate text-sm text-paper/70">{t.artist}</span>
          </span>
        </button>
        <SaveHeart trackId={t.id} className="hidden sm:inline-flex" />
        <button
          type="button"
          onClick={player.toggle}
          aria-label={player.playing ? "Pause" : "Play"}
          className="press inline-flex h-11 w-11 items-center justify-center rounded-full bg-yellow text-ink"
        >
          {player.playing ? (
            <Pause className="h-5 w-5 fill-ink" />
          ) : (
            <Play className="h-5 w-5 fill-ink" />
          )}
        </button>
        <button
          type="button"
          onClick={player.next}
          aria-label="Next song"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper/15"
        >
          <SkipForward className="h-5 w-5 fill-paper" />
        </button>
      </div>
      {player.error ? (
        <p className="px-4 pb-2 text-center text-xs text-pink-300">{player.error}</p>
      ) : null}
    </div>
  );
}

/** Full-screen Now Playing. */
export function NowPlaying() {
  const player = usePlayer();
  const t = player.current;

  useEffect(() => {
    if (!player.expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && player.setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player]);

  if (!player.expanded || !t) return null;
  const RepeatIcon = player.repeat === "one" ? Repeat1 : Repeat;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="wave-field grad-blue-magenta min-h-full text-paper">
        <div className="mx-auto max-w-5xl px-5 pb-10 pt-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => player.setExpanded(false)}
              aria-label="Close now playing"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper/15"
            >
              <ChevronDown className="h-7 w-7" />
            </button>
            <p className="mono-kicker">Now playing</p>
            <span className="w-11" />
          </div>

          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
            <div>
              <div className="mx-auto max-w-sm lg:max-w-none">
                <Cover
                  src={t.artworkUrl}
                  className="rounded-lg border-4 shadow-[6px_6px_0_0_var(--ink)]"
                />
              </div>
              <div className="mt-6 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-4xl leading-none">{t.title}</h1>
                  <Link
                    to="/listen/artist/$id"
                    params={{ id: t.artistId }}
                    onClick={() => player.setExpanded(false)}
                    className="mt-2 inline-block text-lg font-bold underline"
                  >
                    {t.artist}
                  </Link>
                  {t.artistRegion ? (
                    <span className="text-lg text-paper/80"> · {t.artistRegion}</span>
                  ) : null}
                </div>
                <SaveHeart trackId={t.id} className="h-12 w-12" />
              </div>

              <div className="mt-5">
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, player.duration)}
                  step={1}
                  value={Math.min(player.time, player.duration || 0)}
                  onChange={(e) => player.seek(Number(e.target.value))}
                  aria-label="Seek"
                  className="w-full accent-cyan"
                />
                <div className="flex justify-between font-mono text-xs text-paper/80">
                  <span>{formatDuration(player.time * 1000)}</span>
                  <span>{formatDuration(player.duration * 1000)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={player.toggleShuffle}
                  aria-pressed={player.shuffle}
                  aria-label="Shuffle"
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${player.shuffle ? "text-green" : "text-paper/80"}`}
                >
                  <Shuffle className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={player.prev}
                  aria-label="Previous song"
                  className="inline-flex h-14 w-14 items-center justify-center rounded-full hover:bg-paper/15"
                >
                  <SkipBack className="h-7 w-7 fill-paper" />
                </button>
                <button
                  type="button"
                  onClick={player.toggle}
                  aria-label={player.playing ? "Pause" : "Play"}
                  className="press inline-flex h-20 w-20 items-center justify-center rounded-full bg-yellow text-ink"
                >
                  {player.playing ? (
                    <Pause className="h-9 w-9 fill-ink" />
                  ) : (
                    <Play className="h-9 w-9 fill-ink" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={player.next}
                  aria-label="Next song"
                  className="inline-flex h-14 w-14 items-center justify-center rounded-full hover:bg-paper/15"
                >
                  <SkipForward className="h-7 w-7 fill-paper" />
                </button>
                <button
                  type="button"
                  onClick={player.cycleRepeat}
                  aria-label={`Repeat: ${player.repeat}`}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${player.repeat !== "off" ? "text-green" : "text-paper/80"}`}
                >
                  <RepeatIcon className="h-5 w-5" />
                </button>
              </div>
              {player.error ? (
                <p className="mt-3 text-center text-sm text-pink-200">{player.error}</p>
              ) : null}
            </div>

            <div>
              <p className="mono-kicker text-yellow">Up next</p>
              {player.upNext.length ? (
                <ol className="mt-3 overflow-hidden rounded-md border-2 border-ink bg-ink/35">
                  {player.upNext.map((u, i) => (
                    <li key={`${u.id}-${i}`} className="border-b border-paper/15 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => player.jumpTo(u.id)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-paper/10"
                      >
                        <span className="w-10 shrink-0">
                          <Cover src={u.artworkUrl} className="rounded-sm border" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold">{u.title}</span>
                          <span className="block truncate text-sm text-paper/75">{u.artist}</span>
                        </span>
                        <span className="font-mono text-xs text-paper/70">
                          {formatDuration(u.durationMs)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-paper/80">That's the end of the queue.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function totalDuration(tracks: ListenTrack[]) {
  const minutes = Math.round(tracks.reduce((a, t) => a + t.durationMs, 0) / 60000);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`;
}

/** Stanley in white, for the dark listener grounds (the shared <Stanley> is always black). */
export function WhiteStanley({
  src,
  className = "",
  flip = false,
}: {
  src: string;
  className?: string;
  flip?: boolean;
}) {
  return (
    <img
      src={src}
      alt="Stanley, The Pack's dog, animated"
      className={`pointer-events-none select-none object-contain ${flip ? "scale-x-[-1]" : ""} ${className}`}
    />
  );
}
