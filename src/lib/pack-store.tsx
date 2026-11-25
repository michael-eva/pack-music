import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PlaybackHoursRow } from "./playback-hours";

/* ---------- Seed data (invented, from the spec) ---------- */
export type Song = { id: string; title: string; artist: string; length: string; genre: string; energy: "Low" | "Medium" | "High"; setting: string; lufs: number; art: number };
export type Artist = { slug: string; name: string; region: string; bio: string; story: string };
export type Business = { slug: string; code: string; name: string; type: string; suburb: string; hours: string; vibe: string; nowPlaying: string | null; onAir: boolean; state: "ON AIR" | "On air" | "Silent, open now"; heartbeat: string; skips: number; recent: string[]; art: number };

export const artists: Artist[] = [
  { slug: "the-southerlies", name: "The Southerlies", region: "Fremantle", bio: "Four-piece folk band from Fremantle, led by songwriter Sam Reilly.", story: "Started as Sunday sessions in a South Fremantle backyard. Songs about tides, trains and leaving home for a while." },
  { slug: "marlo-finch", name: "Marlo Finch", region: "Margaret River", bio: "Singer-songwriter writing slow, warm songs between surf checks.", story: "Recorded her first EP in a shed on a vineyard, one microphone, one take per song." },
  { slug: "dune-season", name: "Dune Season", region: "Perth", bio: "Dreamy indie duo from Perth.", story: "Two friends, one old synth, and a lot of late buses home from gigs in Northbridge." },
];

export const songs: Song[] = [
  { id: "long-way-down", title: "Long Way Down", artist: "the-southerlies", length: "3:42", genre: "Folk", energy: "Low", setting: "Café", lufs: -14.2, art: 0 },
  { id: "tide-tables", title: "Tide Tables", artist: "the-southerlies", length: "4:05", genre: "Folk", energy: "Low", setting: "Café", lufs: -13.8, art: 1 },
  { id: "kestrel-road", title: "Kestrel Road", artist: "the-southerlies", length: "3:18", genre: "Folk", energy: "Medium", setting: "Bookshop", lufs: -14.0, art: 2 },
  { id: "slow-water", title: "Slow Water", artist: "marlo-finch", length: "4:21", genre: "Folk", energy: "Low", setting: "Salon", lufs: -14.5, art: 3 },
  { id: "paper-boats", title: "Paper Boats", artist: "dune-season", length: "3:02", genre: "Indie", energy: "Medium", setting: "Café", lufs: -13.9, art: 4 },
  { id: "night-bus", title: "Night Bus", artist: "the-southerlies", length: "3:55", genre: "Indie", energy: "Medium", setting: "Bar", lufs: -14.1, art: 5 },
];

export const businesses: Business[] = [
  { slug: "example-cafe", code: "exa", name: "Example Café", type: "Café", suburb: "Fremantle", hours: "Mon–Fri 6:30 am – 3 pm · Sat–Sun 7 am – 2 pm", vibe: "Sunny corner café. Slow mornings, soft voices, lots of acoustic guitar.", nowPlaying: "tide-tables", onAir: true, state: "ON AIR", heartbeat: "12 sec ago", skips: 3, recent: ["the-southerlies", "marlo-finch", "dune-season"], art: 0 },
  { slug: "corner-books", code: "cob", name: "Corner Books", type: "Bookshop", suburb: "Vincent", hours: "Tue–Sun 10 am – 6 pm", vibe: "Quiet, warm, a bit bookish. Nothing that fights a good page.", nowPlaying: "slow-water", onAir: true, state: "On air", heartbeat: "40 sec ago", skips: 1, recent: ["marlo-finch", "the-southerlies"], art: 3 },
  { slug: "harbour-salon", code: "has", name: "Harbour Salon", type: "Salon", suburb: "Fremantle", hours: "Wed–Sat 9 am – 5 pm", vibe: "Bright and chatty, with upbeat indie behind the dryers.", nowPlaying: null, onAir: false, state: "Silent, open now", heartbeat: "2 hrs ago", skips: 0, recent: ["dune-season"], art: 4 },
];

export const recentPlays: Record<string, string[]> = { "harbour-salon": ["paper-boats", "night-bus", "kestrel-road"] };

export const song = (id: string | undefined) => songs.find(s => s.id === id)!;
export const artistOf = (s: Song) => artists.find(a => a.slug === s.artist)!;
export const artistBySlug = (slug: string) => artists.find(a => a.slug === slug);
export const businessBySlug = (slug: string) => businesses.find(b => b.slug === slug);
export const businessByCode = (code: string) => businesses.find(b => b.code === code);

export const PEOPLE = { curator: "Alex", admin: "Sam", songwriter: "Sam Reilly" };

/* ---------- State ---------- */
export type Save = { songId: string; business: string | null; date: string };
export type Playlist = { id: string; name: string; songIds: string[] };
export type Follow = { id: string; kind: "artist" | "business"; public: boolean };
export type Suggestion = { id: string; songId: string; business: string; note: string; source: "Listener" | "Auto-surfaced" };
export type ReleaseStatus = "Received" | "Checking" | "Needs attention" | "In review" | "Live" | "Withdrawn";
export type Release = { id: string; title: string; version: number; status: ReleaseStatus };
export type AuditEntry = { who: string; what: string; when: string; old?: string | undefined; new?: string | undefined };
export type Invite = { id: string; person: string; role: "Artist" | "Business"; cohort: string; status: "Invited" | "Joined" | "Deactivated" };
export type Setting = { key: string; label: string; value: string; changed: string };

// Listener account fields are the LIS-6 minimum; terms records the ACC-7 acceptance.
export type PackUser = {
  email: string; displayName?: string | undefined; postcode?: string | undefined; newsOptIn?: boolean | undefined;
  terms?: { version: string; acceptedAt: string } | undefined;
};

export type PackState = {
  playbackHours: PlaybackHoursRow[];
  user: PackUser | null;
  guestSaved: boolean;
  saves: Save[];
  playlists: Playlist[];
  follows: Follow[];
  suggestions: Suggestion[];
  releases: Release[];
  audit: AuditEntry[];
  invites: Invite[];
  testMode: boolean;
  settings: Setting[];
  flags: { player: boolean; home: boolean; map: boolean };
  tuned: string[];
  artist: { account: boolean; coop: boolean; profile: boolean; agreementDate: string | null; displayName: string; legalName: string; region: string; bio: string; links: string };
  bizAck: boolean;
  bizActive: "pack" | "house";
  houseSongs: string[];
  staffName: string;
  queue: string[];
};

const today = () => new Date().toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
export const nowStamp = () => new Date().toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export const seed: PackState = {
  playbackHours: [],
  user: null,
  guestSaved: false,
  saves: [{ songId: "slow-water", business: "corner-books", date: "Sat 19 Sep" }],
  playlists: [{ id: "p1", name: "Sunday slow", songIds: ["slow-water"] }],
  follows: [{ id: "the-southerlies", kind: "artist", public: false }, { id: "example-cafe", kind: "business", public: false }],
  suggestions: [
    { id: "s1", songId: "paper-boats", business: "example-cafe", note: "Feels like a sunny Saturday.", source: "Listener" },
    { id: "s2", songId: "kestrel-road", business: "example-cafe", note: "New upload tagged Café, Low energy.", source: "Auto-surfaced" },
    { id: "s3", songId: "night-bus", business: "example-cafe", note: "", source: "Listener" },
  ],
  releases: [
    { id: "r1", title: "Kestrel Road (EP)", version: 1, status: "Needs attention" },
    { id: "r2", title: "Tide Tables (single)", version: 1, status: "Live" },
    { id: "r3", title: "Night Bus (single)", version: 1, status: "Live" },
  ],
  audit: [{ who: "Alex", what: "Switched Test mode on", when: "3 Sep, 9:12 am", old: "Off", new: "On" }],
  invites: [
    { id: "i1", person: "sam@thesoutherlies.example", role: "Artist", cohort: "Fremantle 1", status: "Joined" },
    { id: "i2", person: "marlo@example.com", role: "Artist", cohort: "Fremantle 1", status: "Invited" },
    { id: "i3", person: "hello@cornerbooks.example", role: "Business", cohort: "Corner Books", status: "Invited" },
  ],
  testMode: true,
  settings: [
    { key: "fee", label: "Site fee", value: "$49.99 per site per month", changed: "1 Sep" },
    { key: "split", label: "Revenue split", value: "70% artists, 30% The Pack", changed: "1 Sep" },
    { key: "play", label: "Play threshold", value: "30 seconds", changed: "1 Sep" },
    { key: "payout", label: "Payout threshold", value: "$10", changed: "1 Sep" },
    { key: "lufs", label: "Loudness target", value: "-14 LUFS", changed: "1 Sep" },
    { key: "ai", label: "Accepted AI answers", value: "No", changed: "1 Sep" },
    { key: "rules", label: "Playlist rules", value: "No artist twice in a row, no repeat in 3 hours", changed: "1 Sep" },
  ],
  flags: { player: true, home: true, map: true },
  tuned: ["Folk", "Indie"],
  artist: { account: false, coop: false, profile: false, agreementDate: null, displayName: "The Southerlies", legalName: "Samuel Reilly", region: "Fremantle", bio: "Four-piece folk band from Fremantle.", links: "thesoutherlies.example" },
  bizAck: false,
  bizActive: "pack",
  houseSongs: ["long-way-down"],
  staffName: "Jess",
  queue: ["tide-tables", "slow-water", "paper-boats", "night-bus"],
};

type Ctx = {
  state: PackState;
  set: (fn: (s: PackState) => PackState) => void;
  log: (who: string, what: string, old?: string, nw?: string) => void;
  money: (n: number) => string;
  reset: () => void;
  saveSong: (songId: string, business: string | null) => void;
  isSaved: (songId: string) => Save | undefined;
};

const PackCtx = createContext<Ctx | null>(null);
const KEY = "the-pack-store-v2";

export function PackProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PackState>(seed);
  const loaded = useRef(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setState({ ...seed, ...JSON.parse(raw) }); } catch { /* ignore */ }
    loaded.current = true;
  }, []);
  useEffect(() => { if (loaded.current) localStorage.setItem(KEY, JSON.stringify(state)); }, [state]);

  const set = useCallback((fn: (s: PackState) => PackState) => setState(fn), []);
  const log = useCallback((who: string, what: string, old?: string, nw?: string) =>
    setState(s => ({ ...s, audit: [{ who, what, when: nowStamp(), old, new: nw }, ...s.audit] })), []);
  const value = useMemo<Ctx>(() => ({
    state, set, log,
    money: (n: number) => `$${n.toFixed(2)}${state.testMode ? " (simulated)" : ""}`,
    reset: () => setState(seed),
    saveSong: (songId, business) => setState(s => s.saves.some(x => x.songId === songId) ? s : { ...s, saves: [{ songId, business, date: today() }, ...s.saves] }),
    isSaved: (songId) => state.saves.find(x => x.songId === songId),
  }), [state, set, log]);
  return <PackCtx.Provider value={value}>{children}</PackCtx.Provider>;
}

export function usePack() {
  const c = useContext(PackCtx);
  if (!c) throw new Error("usePack must be used inside PackProvider");
  return c;
}

export const heardTag = (s: Save) => s.business ? `Heard at ${businessBySlug(s.business)?.name} · ${s.date}` : null;
