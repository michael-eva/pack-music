import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, GripVertical, Pause, Play, Plus, SkipBack, SkipForward, X } from "lucide-react";
import { Art, Bar, Card, Chip, Empty, Hero, OnAir, Phone } from "./kit";
import { artistOf, artists, businessBySlug, businesses, heardTag, song, songs, usePack, type Business } from "@/lib/pack-store";
import { cn } from "@/lib/utils";
import { mergePlaybackRows, splitPlaybackSeconds } from "@/lib/playback-hours";

const SECTIONS = [
  { by: "Curated by Alex & The Pack", title: "slow songs from Fremantle", genre: "Folk", ids: ["tide-tables", "long-way-down", "kestrel-road"] },
  { by: "Curated by Sam", title: "fresh from Margaret River", genre: "Folk", ids: ["slow-water"] },
  { by: "Curated by Corner Books", title: "Corner Books picks", genre: "Indie", ids: ["paper-boats", "night-bus"] },
  { by: "Curated by Alex & The Pack", title: "Saturday bar warm-up", genre: "Rock", ids: ["night-bus", "paper-boats"] },
];

/* E1 */
export function HomePage() {
  const { state, set } = usePack();
  const ordered = [...SECTIONS].sort((a, b) => Number(state.tuned.includes(b.genre)) - Number(state.tuned.includes(a.genre)));
  const isF = (id: string) => state.follows.some(f => f.id === id);
  const [asking, setAsking] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const qn = query.trim().toLocaleLowerCase("en-AU");
  const matches = [...songs.map(s => ({ kind: "song" as const, id: s.id, name: s.title })), ...artists.map(a => ({ kind: "artist" as const, id: a.slug, name: a.name })), ...businesses.map(b => ({ kind: "business" as const, id: b.slug, name: b.name }))]
    .filter(i => i.name.toLocaleLowerCase("en-AU").includes(qn)).sort((a, b) => a.name.localeCompare(b.name, "en-AU"));
  const follow = (id: string, kind: "artist" | "business", pub: boolean) => { set(s => ({ ...s, follows: [...s.follows, { id, kind, public: pub }] })); setAsking(null); };
  const toggle = (id: string, kind: "artist" | "business") => isF(id) ? set(s => ({ ...s, follows: s.follows.filter(f => f.id !== id) })) : setAsking(id + "|" + kind);
  return <Phone>
    <Hero><div className="flex justify-between items-start gap-2"><h1 className="pk-h1">Evening{state.user ? "" : ", friend"}</h1><Link to="/me" className="pk-chip pk-chip-dark">Tuned to: {state.tuned.join(", ")}</Link></div>
      <p className="mt-2 opacity-95">Every list here was created by a human being.</p></Hero>
    <div className="p-5 space-y-7">
      <div><label className="block font-bold">Search by name<input type="search" className="pk-input mt-2" placeholder="Songs, artists or Pack places" value={query} onChange={e => setQuery(e.target.value)} /></label>
        {qn && <ul className="mt-3 space-y-2" aria-label="Search results">{matches.length ? matches.map(i => <li key={i.kind + i.id}>{i.kind === "song" ? <Link to="/player" search={{ song: i.id }} className="underline font-semibold">{i.name}</Link> : i.kind === "artist" ? <Link to="/artist/$slug" params={{ slug: i.id }} className="underline font-semibold">{i.name}</Link> : <Link to="/business/$slug" params={{ slug: i.id }} className="underline font-semibold">{i.name}</Link>} <span className="text-xs">· {i.kind === "song" ? "Song" : i.kind === "artist" ? "Artist" : "Pack place"}</span></li>) : <li className="text-sm">No matches.</li>}</ul>}</div>
      {ordered.map(sec => <section key={sec.by + sec.title}>
        <p className="pk-eyebrow text-pk-blue">{sec.by}</p><h2 className="pk-h2">{sec.title}</h2>
        <div className="flex gap-3 overflow-x-auto mt-3 pb-1">{sec.ids.map(id => { const s = song(id); return <div key={id} className="w-32 shrink-0"><Link to="/player" search={{ song: id }}><Art seed={s.art} className="w-32 h-32 border-2 border-pk-black" /><p className="font-bold mt-1 text-sm">{s.title}</p></Link><Link to="/artist/$slug" params={{ slug: s.artist }} className="text-xs underline">{artistOf(s).name}</Link></div>; })}</div>
      </section>)}
      <section><h2 className="pk-h2">Following</h2><div className="flex gap-3 overflow-x-auto mt-3">
        {[...artists.map(a => ({ id: a.slug, name: a.name, kind: "artist" as const })), ...businesses.map(b => ({ id: b.slug, name: b.name, kind: "business" as const }))].map(x =>
          <div key={x.id} className="pk-card w-36 shrink-0 p-3 text-center"><p className="font-bold text-sm h-10">{x.kind === "artist" ? <Link to="/artist/$slug" params={{ slug: x.id }} className="underline">{x.name}</Link> : <Link to="/business/$slug" params={{ slug: x.id }} className="underline">{x.name}</Link>}</p><button className={cn("pk-chip mt-1", isF(x.id) ? "pk-chip-dark" : "pk-chip-blue")} onClick={() => toggle(x.id, x.kind)}>{isF(x.id) ? "Following" : "Follow"}</button>
            {asking === x.id + "|" + x.kind && <div className="mt-2 flex flex-col gap-1"><button className="pk-chip pk-chip-soft justify-center" onClick={() => follow(x.id, x.kind, false)}>Follow privately</button><button className="pk-chip pk-chip-soft justify-center" onClick={() => follow(x.id, x.kind, true)}>Follow publicly</button></div>}</div>)}
      </div></section>
    </div>
  </Phone>;
}

/* E2 */
export function PlayerPage({ songId }: { songId?: string | undefined }) {
  const { state, set, saveSong, isSaved } = usePack();
  const [cur, setCur] = useState<string>(songId ?? state.queue[0] ?? "tide-tables");
  const [playing, setPlaying] = useState(true); const [prog, setProg] = useState(10);
  const [addOpen, setAddOpen] = useState(false); const [drag, setDrag] = useState<number | null>(null);
  useEffect(() => { if (!playing) return; const t = setInterval(() => setProg(p => p >= 100 ? 0 : p + 1), 500); return () => clearInterval(t); }, [playing]);
  useEffect(() => {
    if (!playing || !songs.some(track => track.id === cur)) return;
    let started = document.visibilityState === "visible" ? Date.now() : null;
    const flush = () => {
      const end = Date.now();
      if (started !== null) for (const row of splitPlaybackSeconds(started, end)) {
        set(value => ({ ...value, playbackHours: mergePlaybackRows(value.playbackHours, { ...row, source: "listener" }) }));
      }
      started = document.visibilityState === "visible" ? end : null;
    };
    const visibility = () => { flush(); };
    const leaving = () => { flush(); started = null; };
    const timer = window.setInterval(flush, 10000);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leaving);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", leaving); flush(); };
  }, [playing, cur, set]);
  const s = song(cur); const sv = isSaved(cur);
  const queue = state.queue.filter(id => id !== cur);
  const step = (d: number) => { const all = state.queue; const i = all.indexOf(cur); setCur(all[(i + d + all.length) % all.length]!); setProg(0); };
  const drop = (to: number) => { if (drag === null) return; const q = [...queue]; const [m] = q.splice(drag, 1); q.splice(to, 0, m!); set(x => ({ ...x, queue: [cur, ...q] })); setDrag(null); };
  const move = (i: number, d: number) => { const q = [...queue]; const j = i + d; if (j < 0 || j >= q.length) return; [q[i], q[j]] = [q[j]!, q[i]!]; set(x => ({ ...x, queue: [cur, ...q] })); };
  return <Phone>
    <div className="grad-hero pk-dots text-pk-white p-4">
      <Art seed={s.art} className="w-40 h-40 mx-auto border-2 border-pk-white relative z-10" />
      <div className="relative z-10">
        <h1 className="pk-h2 mt-3">{s.title}</h1>
        <p className="text-lg font-semibold"><Link to="/artist/$slug" params={{ slug: s.artist }} className="underline">{artistOf(s).name}</Link> · {artistOf(s).region}</p>
        <p className="text-sm mt-1 opacity-90">Curated by Alex &amp; The Pack</p>
        {sv && heardTag(sv) && <Chip tone="dark" className="mt-2">{sv.business ? `Heard at ${businessBySlug(sv.business)?.name} · ${sv.date.replace(/^\w+ /, "")}` : ""}</Chip>}
        <div className="h-2 rounded-full bg-pk-white/30 mt-3"><div className="h-full rounded-full bg-pk-white" style={{ width: `${prog}%` }} /></div>
        <div className="flex justify-center items-center gap-6 mt-3">
          <button aria-label="Previous" onClick={() => step(-1)}><SkipBack size={30} /></button>
          <button aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying(!playing)} className="w-16 h-16 rounded-full bg-pk-white text-pk-blue grid place-items-center">{playing ? <Pause size={30} /> : <Play size={30} />}</button>
          <button aria-label="Next" onClick={() => step(1)}><SkipForward size={30} /></button>
        </div>
        <div className="flex gap-3 mt-3">
          <button className="pk-btn pk-btn-ghost flex-1" onClick={() => saveSong(cur, null)} disabled={!!sv}>{sv ? "Saved" : "Save to library"}</button>
          <button className="pk-btn pk-btn-ghost flex-1" onClick={() => setAddOpen(!addOpen)}><Plus size={16} /> Add to playlist</button>
        </div>
        {addOpen && <div className="bg-pk-white text-pk-black rounded-2xl p-3 mt-3 space-y-1">{state.playlists.map(p => <button key={p.id} className="block w-full text-left font-semibold px-2 py-1 rounded hover:bg-pk-cream" onClick={() => { set(x => ({ ...x, playlists: x.playlists.map(y => y.id === p.id && !y.songIds.includes(cur) ? { ...y, songIds: [...y.songIds, cur] } : y) })); setAddOpen(false); }}>{p.name}</button>)}</div>}
      </div>
    </div>
    <div className="p-5"><h2 className="pk-h2">Up next</h2><p className="text-sm text-muted-foreground">Drag to reorder.</p>
      <ul className="mt-3 space-y-2">{queue.map((id, i) => <li key={id} draggable onDragStart={() => setDrag(i)} onDragOver={e => e.preventDefault()} onDrop={() => drop(i)} className="pk-card py-2 flex items-center gap-3 cursor-grab">
        <GripVertical className="text-muted-foreground" /><Art seed={song(id).art} className="w-10 h-10" /><div className="flex-1"><p className="font-bold text-sm">{song(id).title}</p><Link to="/artist/$slug" params={{ slug: song(id).artist }} className="text-xs underline">{artistOf(song(id)).name}</Link></div>
        <button aria-label="Move up" className="text-xs underline" onClick={() => move(i, -1)}>Up</button><button aria-label="Move down" className="text-xs underline" onClick={() => move(i, 1)}>Down</button>
      </li>)}</ul></div>
  </Phone>;
}

/* E3 */
export { LibraryPage } from "./LibraryViews";

/* E4 */
export function MoneyPage() {
  const { state, money } = usePack();
  const [amt, setAmt] = useState<number | null>(null); const [done, setDone] = useState(false);
  const rows: [string, number][] = [["The Southerlies", 2.10], ["Marlo Finch", 1.50], ["Dune Season", 1.05], ["Other artists", 2.34]];
  return <Phone>
    <Hero><h1 className="pk-h1">Where your $9.99 goes</h1>{state.testMode && <p className="text-sm mt-1">Test mode: figures are simulated.</p>}</Hero>
    <div className="p-5 space-y-5">
      <Bar parts={[{ label: `${money(6.99)} to the artists you listened to`, value: 6.99, cls: "grad-hero" }, { label: `${money(3)} to The Pack`, value: 3, cls: "bg-pk-orange" }]} />
      <Card><ul className="divide-y">{rows.map(([n, v]) => <li key={n} className="flex justify-between py-2"><span className="font-semibold">{n}</span><span>{money(v)}</span></li>)}<li className="flex justify-between py-2 font-black"><span>To artists</span><span>{money(6.99)}</span></li></ul></Card>
      <div className="pk-card grad-pp">
        <h2 className="pk-h2">Become a Patron</h2><p className="mt-1">Give a little extra. It goes to the music industry development fund, to support artists who need it most.</p>
        <div className="grid grid-cols-4 gap-2 mt-3">{[2, 5, 10, 15].map(a => <button key={a} onClick={() => setAmt(a)} className={cn("pk-chip justify-center py-2 text-base", amt === a ? "pk-chip-dark" : "pk-chip-soft")}>${a}/mo</button>)}</div>
        <button className="pk-btn mt-4 w-full" disabled={!amt} onClick={() => setDone(true)}>Become a Patron</button>
        {done && <p className="mt-2 font-semibold">Thank you. ${amt} a month{state.testMode ? " (simulated, nothing is charged)" : ""}.</p>}
        <a className="block mt-3 underline font-semibold text-sm" href="#report">See the development fund report</a>
      </div>
    </div>
  </Phone>;
}

/* E5 */
const PINS: Record<string, { x: number; y: number }> = { "example-cafe": { x: 28, y: 68 }, "corner-books": { x: 62, y: 30 }, "harbour-salon": { x: 38, y: 78 } };
const GIGS = [{ artist: "The Southerlies", when: "Fri 25 Sep, 7 pm", where: "example-cafe" }, { artist: "Dune Season", when: "Sat 3 Oct, 6 pm", where: "example-cafe" }, { artist: "Marlo Finch", when: "Sun 11 Oct, 4 pm", where: "corner-books" }];
export function MapPage() {
  const [filters, setFilters] = useState<string[]>([]); const [pin, setPin] = useState<Business | null>(null); const [gigs, setGigs] = useState(false);
  const f = (k: string) => setFilters(x => x.includes(k) ? x.filter(y => y !== k) : [...x, k]);
  const shown = businesses.filter(b => !filters.includes("Open now") || b.onAir || b.state.includes("open"));
  return <Phone>
    <Hero grad="grad-cy" className="text-pk-black"><Chip tone="dark">Phase 4 preview · not in the pilot</Chip><h1 className="pk-h1 mt-2">Pack places near me</h1>
      <div className="flex gap-2 flex-wrap mt-3">{["Open now", "Vibe", "Local artists"].map(k => <button key={k} onClick={() => f(k)} className={cn("pk-chip", filters.includes(k) ? "pk-chip-dark" : "pk-chip-soft")}>{k}</button>)}
        <button onClick={() => setGigs(!gigs)} className="pk-chip pk-chip-blue"><CalendarDays size={14} /> {gigs ? "Back to map" : "Gig calendar"}</button></div></Hero>
    {gigs ? <div className="p-5"><h2 className="pk-h2">Gig guide</h2><p className="text-sm text-muted-foreground">Published by artists themselves via Giglist / ENTX (partner API). Not ranked.</p>
      <ul className="mt-3 space-y-2">{GIGS.map(g => <li key={g.artist + g.when} className="pk-card py-3"><p className="font-bold">{g.artist}</p><p className="text-sm">{g.when} · {businessBySlug(g.where)?.name}</p></li>)}</ul></div>
      : <div className="p-5"><div className="relative aspect-[4/5] rounded-3xl border-2 border-pk-black overflow-hidden bg-pk-cream">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden><path d="M0 95 C20 90 25 110 45 105 S80 115 100 100 V125 H0Z" fill="var(--pk-teal)" opacity=".6" /><path d="M10 0 L30 125 M0 50 H100 M60 0 L75 125" stroke="var(--pk-peach)" strokeWidth="3" fill="none" /></svg>
        {shown.map(b => <button key={b.slug} onClick={() => setPin(b)} className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center" style={{ left: `${PINS[b.slug]!.x}%`, top: `${PINS[b.slug]!.y}%` }}>
          <span className={cn("pk-chip", b.onAir ? "pk-chip-pink" : "pk-chip-dark")}>{b.name}</span><span className="w-3 h-3 rounded-full bg-pk-black mt-0.5" /></button>)}
      </div>
      {pin && <div className="pk-card mt-4 relative"><button className="absolute right-3 top-3" aria-label="Close" onClick={() => setPin(null)}><X size={18} /></button>
        <div className="flex items-center gap-2"><h2 className="pk-h2">{pin.name}</h2>{pin.onAir && <OnAir small />}</div><p className="text-sm">{pin.type} · {pin.suburb}</p>
        <p className="pk-eyebrow mt-3">Upcoming gigs</p>
        {GIGS.filter(g => g.where === pin.slug).length ? <ul className="text-sm mt-1">{GIGS.filter(g => g.where === pin.slug).map(g => <li key={g.when}>{g.artist}, {g.when}</li>)}</ul> : <p className="text-sm">No gigs listed.</p>}
        <p className="text-xs text-muted-foreground mt-2">From Giglist / ENTX. Artists choose which of their gigs to publish.</p>
        <Link to="/business/$slug" params={{ slug: pin.slug }} className="pk-btn pk-btn-ghost mt-3">Open business page</Link></div>}
      </div>}
  </Phone>;
}

/* Me */
export function MePage() {
  const { state, set, reset } = usePack();
  const [openData, setOpenData] = useState(false);
  const [twoStep, setTwoStep] = useState(false); const [handoff, setHandoff] = useState(false);
  const genres = ["Folk", "Indie", "Rock", "Electronic", "Jazz", "Hip hop"];
  return <Phone>
    <Hero><h1 className="pk-h1">Me</h1><p className="text-sm mt-1">{state.user ? `Signed in as ${state.user.email}` : "Not signed in"}</p></Hero>
    <div className="p-5 space-y-5">
      <Card><h2 className="pk-h3">Tune your home</h2><p className="text-sm">Changes the order of curated sections, never what's in them.</p>
        <div className="flex gap-2 flex-wrap mt-3">{genres.map(g => <button key={g} onClick={() => set(s => ({ ...s, tuned: s.tuned.includes(g) ? s.tuned.filter(x => x !== g) : [...s.tuned, g] }))} className={cn("pk-chip", state.tuned.includes(g) ? "pk-chip-blue" : "pk-chip-soft")}>{g}</button>)}</div></Card>
      <Card className="space-y-2"><Link to="/money" className="block font-bold underline">Where your $9.99 goes</Link><Link to="/membership" className="block font-bold underline">Membership and patron options</Link><Link to="/saved" className="block font-bold underline">Saved songs</Link><Link to="/contact" className="block font-bold underline">Contact and help</Link></Card>
      <Card><h2 className="pk-h3">Two-step sign-in</h2><p className="text-sm">Optional for listeners. Enter a 6-digit code from an authenticator app when you sign in.</p>
        <label className="pk-check mt-3 text-sm font-normal"><input type="checkbox" checked={twoStep} onChange={e => setTwoStep(e.target.checked)} /> Two-step sign-in {twoStep ? "on" : "off"} (simulated)</label></Card>
      <Card><h2 className="pk-h3">Payment card</h2><p className="text-sm">Card details are handled by Stripe. The Pack never stores card numbers.</p>
        <button className="pk-btn pk-btn-ghost mt-3" onClick={() => setHandoff(true)}>Manage payment card</button>
        {handoff && <p role="status" className="text-sm mt-3">You'd now go to Stripe's secure page (simulated in the pilot).</p>}</Card>
      <Card><h2 className="pk-h3">Your data</h2><p className="text-sm">Private by default. Public follows show your display name to that artist or business.</p>
        <label className="pk-check mt-3 text-sm font-normal"><input type="checkbox" checked={openData} onChange={e => setOpenData(e.target.checked)} /> Open data project: include my listening in area (SA2) totals that never name anyone. Turning this off stops future inclusion; published totals can't be recalled.</label>
        <div className="flex gap-2 mt-3 flex-wrap">{state.user && <button className="pk-btn pk-btn-ghost" onClick={() => set(s => ({ ...s, user: null }))}>Sign out</button>}<button className="pk-btn pk-btn-ghost" onClick={reset}>Reset demo data</button></div></Card>
      <p className="text-xs text-muted-foreground text-center">No Facebook. No Google. Email and password, or an email link.</p>
    </div>
  </Phone>;
}
export { songs };
