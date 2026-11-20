import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, QrCode, SkipForward, WifiOff } from "lucide-react";
import { Art, Bar, Card, Chip, Desk, OnAir, PageTitle, TrialNote } from "./kit";
import { artistOf, businesses, song, songs, usePack } from "@/lib/pack-store";
import { mergePlaybackRows, splitPlaybackSeconds } from "@/lib/playback-hours";

const MENU = [
  { to: "/biz/player", label: "Player" }, { to: "/biz/site", label: "My site" }, { to: "/biz/playlists", label: "Playlists" },
  { to: "/biz/plan", label: "My plan" }, { to: "/biz/staff", label: "Staff" },
];
const cafe = businesses[0]!;
const PACK_LIST = ["tide-tables", "slow-water", "paper-boats", "long-way-down", "night-bus"];
function BizDesk({ children }: { children: React.ReactNode }) { return <Desk area={`Business · ${cafe.name}`} grad="grad-oy" menu={MENU}><nav aria-label="Business support" className="mb-4"><a href="/contact" className="underline font-semibold">Contact The Pack</a></nav>{children}</Desk>; }

/* B1 */
export function BizNotice() {
  const { set } = usePack(); const nav = useNavigate();
  const [ok, setOk] = useState(false); const [rules, setRules] = useState(false);
  return <div className="pk min-h-screen grad-oy pk-dots flex items-center justify-center p-4">
    <div className="pk-card max-w-2xl w-full relative z-10">
      <p className="pk-eyebrow text-pk-orange">First sign-in · {cafe.name}</p>
      <h1 className="pk-h1">Before you switch on The Pack</h1>
      <div className="grid gap-4 mt-5">
        <section><h2 className="pk-h3">What The Pack is</h2><p>A service that plays music by local, original artists who have given their permission.</p></section>
        <section><h2 className="pk-h3">What it does not do yet</h2><p>It does not replace your OneMusic licence. Keep it until APRA AMCOS confirms in writing that The Pack covers you.</p></section>
        <section><h2 className="pk-h3">What that means for you</h2><p>The Pack costs $49.99 per site, per month during the pilot. The <Link to="/biz/plan" className="underline font-semibold">plan page</Link> has the details.</p></section>
      </div>
      <TrialNote />
      <section className="mt-4"><h2 className="pk-h3">Associate membership</h2><p>Businesses join the co-operative as Associate members (no voting rights). <a href="#rules" className="underline font-semibold">Read the Co-op Rules</a> (version 1.0, September 2026).</p></section>
      <label className="pk-check mt-3"><input type="checkbox" checked={rules} onChange={e => setRules(e.target.checked)} /> I accept the Co-op Rules as an Associate member</label>
      <label className="pk-check mt-3"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} /> I have read this and understand it</label>
      <label className="pk-check mt-3 text-sm font-normal"><input type="checkbox" /> Optional: include this site's aggregate data (never individuals) in an Open data project supporting the health of the music industry, research and government decisions. Data is grouped by area (SA2) and never names anyone. You can withdraw later; that stops future inclusion but can't recall figures already published. Saying no never affects your service.</label>
      <button className="pk-btn mt-5" disabled={!ok || !rules} onClick={() => { set(s => ({ ...s, bizAck: true })); nav({ to: "/biz/site" }); }}>Continue</button>
    </div>
  </div>;
}

/* B2 */
export function BizSite() {
  const [saved, setSaved] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const fields: [string, string][] = [["Site name", cafe.name], ["Address", "12 Market St, Fremantle WA 6160"], ["Region", "Fremantle"], ["Business type", cafe.type], ["Opening hours", cafe.hours], ["Player hours", "7 to 9 am every day"]];
  return <BizDesk>
    <PageTitle eyebrow="My site" title="Your site" />
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
      <Card>
        <div className="grid sm:grid-cols-2 gap-x-4">{fields.map(([l, v]) => <label key={l} className="pk-label">{l}<input className="pk-input" defaultValue={v} /></label>)}</div>
        <label className="pk-label">Vibe<textarea className="pk-input" rows={3} defaultValue={cafe.vibe} /></label>
        <label className="pk-label">Venue photo (optional)
          {photo ? <img src={photo} alt={`${cafe.name} venue`} className="w-28 h-28 rounded-full object-cover my-3" /> : <span className="w-28 h-28 rounded-full bg-pk-orange text-black grid place-items-center text-3xl font-bold my-3" aria-label={cafe.name}>{cafe.name.split(" ").map(word => word[0]).slice(0, 2).join("")}</span>}
          <input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (!file || !file.type.startsWith("image/")) return; const reader = new FileReader(); reader.onload = () => setPhoto(String(reader.result)); reader.readAsDataURL(file); }} />
        </label>{photo && <button type="button" className="underline mb-4" onClick={() => setPhoto(null)}>Remove photo</button>}
        <button className="pk-btn" onClick={() => setSaved(true)}>Save changes</button>{saved && <span className="ml-3 font-semibold">Saved.</span>}
      </Card>
      <div className="space-y-5">
        <Card><h2 className="pk-h3">Your QR code and short link</h2>
          <div className="flex gap-4 items-center mt-3"><QrCode size={84} /><div><p className="font-mono font-bold">thepack.example/c/exa</p><button className="pk-btn pk-btn-ghost mt-2"><Download size={16} /> Download sign kit</button><p className="text-xs mt-1 text-muted-foreground">A5 sign, window sticker, table card</p></div></div>
        </Card>
        <Card><h2 className="pk-h3">Staff</h2><p className="mt-1">Staff can run the player but cannot change the profile or the plan.</p><Link to="/biz/staff" className="underline font-semibold text-sm">Manage staff</Link></Card>
        <Card><h2 className="pk-h3">Followers</h2><p className="text-3xl font-black mt-1">27</p>
          <p className="text-sm">These listeners chose to follow publicly:</p>
          <div className="flex gap-2 flex-wrap mt-2">{["Mia", "Tom R.", "Priya"].map(n => <Chip key={n}>{n}</Chip>)}</div>
          <p className="text-sm mt-2">and 24 more. Only public followers are named.</p>
        </Card>
      </div>
    </div>
  </BizDesk>;
}

/* B3: tablet player */
export function BizPlayer() {
  const { state, set } = usePack();
  const list = state.bizActive === "house" ? state.houseSongs : PACK_LIST;
  const [i, setI] = useState(0);
  const [skipOpen, setSkipOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [vol, setVol] = useState(0);
  const [progress, setProgress] = useState(20);
  const [playing, setPlaying] = useState(true);
  const [online, setOnline] = useState(true);
  useEffect(() => { if (!playing) return; const t = setInterval(() => setProgress(p => p >= 100 ? 0 : p + 1), 600); return () => clearInterval(t); }, [playing]);
  useEffect(() => { const on = () => setOnline(true), off = () => setOnline(false); window.addEventListener("online", on); window.addEventListener("offline", off); setOnline(navigator.onLine); return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); }; }, []);
  const cur = song(list[i % list.length]);
  useEffect(() => {
    if (!state.bizAck || !cur || !playing) return;
    let started = document.visibilityState === "visible" ? Date.now() : null;
    const flush = () => {
      const end = Date.now();
      if (started !== null) for (const row of splitPlaybackSeconds(started, end)) {
        set(value => ({ ...value, playbackHours: mergePlaybackRows(value.playbackHours, { ...row, source: "business" }) }));
      }
      started = document.visibilityState === "visible" ? end : null;
    };
    const visibility = () => { flush(); };
    const leaving = () => { flush(); started = null; };
    const timer = window.setInterval(flush, 10000);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leaving);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", leaving); flush(); };
  }, [state.bizAck, cur?.id, playing, set]);
  const next = [1, 2].map(n => song(list[(i + n) % list.length]));
  const skip = (r: string) => { setReason(r); setSkipOpen(false); setI(i + 1); setProgress(0); };
  const listName = state.bizActive === "house" ? `House picks · curated by ${state.staffName}` : "Weekday morning, café · v3";

  if (!state.bizAck) return <div className="pk min-h-screen grad-oy pk-dots flex items-center justify-center p-4"><div className="pk-card max-w-md w-full relative z-10 text-center"><p className="pk-eyebrow">Player locked</p><h1 className="pk-h2 mt-1">Accept Associate membership first</h1><p className="mt-2">The player switches on once the Co-op Rules are accepted.</p><Link to="/biz" className="pk-btn mt-4">Continue setup</Link></div></div>;
  return <div className="pk min-h-screen bg-pk-black text-pk-white p-4 md:p-6">
    <header className="flex flex-wrap items-center gap-3 justify-between">
      <div className="flex items-center gap-3"><OnAir /><span className="font-bold">{listName}</span></div>
      <div className="flex items-center gap-3"><span className="font-bold">{cafe.name}</span><Link to="/biz/site" className="pk-btn pk-btn-ghost">Exit player</Link></div>
    </header>
    {!online && <p className="mt-3 inline-flex items-center gap-2 text-sm pk-chip pk-chip-amber"><WifiOff size={14} /> Offline, still playing</p>}
    <div className="grid gap-6 mt-6 max-w-5xl mx-auto">
      <section className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-6">
          <Art seed={cur.art} className="w-full sm:w-72 aspect-square" />
          <div className="flex-1 flex flex-col justify-end">
            <h1 className="pk-h1 text-4xl">{cur.title}</h1><p className="text-xl font-semibold">{artistOf(cur).name}</p>
            <p className="mt-2 text-pk-teal font-semibold">{state.bizActive === "house" ? `Curated by ${state.staffName} for ${cafe.name}` : "Curated by Alex & The Pack"}</p>
            <div className="h-2 rounded-full bg-pk-white/20 mt-5"><div className="h-full rounded-full bg-pk-teal" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
        <div className="mt-6 grid md:grid-cols-2 gap-5">
          <div>
            <button className="pk-btn mr-3" onClick={() => setPlaying(value => !value)}>{playing ? "Pause" : "Play"}</button>
            <button className="pk-btn pk-btn-pink pk-btn-big text-2xl py-6" onClick={() => setSkipOpen(!skipOpen)}><SkipForward /> Skip</button>
            {skipOpen && <div className="flex flex-wrap gap-2 mt-3">{["Doesn't fit tonight", "Wrong energy", "Too loud"].map(r => <button key={r} onClick={() => skip(r)} className="pk-chip pk-chip-soft">{r}</button>)}</div>}
            {reason && !skipOpen && <p className="text-sm mt-2 opacity-80">Skipped: {reason}. Sent to the playlist's curator.</p>}
            <label className="block mt-5 font-semibold">Volume trim {vol > 0 ? `+${vol}` : vol} dB<input type="range" min={-6} max={6} value={vol} onChange={e => setVol(+e.target.value)} className="w-full accent-[var(--pk-teal)]" /></label>
          </div>
          <div><p className="pk-eyebrow text-pk-teal">Up next</p>{next.map(n => <div key={n.id} className="flex gap-3 items-center mt-3"><Art seed={n.art} className="w-14 h-14" /><div><p className="font-bold">{n.title}</p><p className="text-sm opacity-80">{artistOf(n).name}</p></div></div>)}</div>
        </div>
      </section>
      <aside className="space-y-4">
        <div className="rounded-2xl border-2 border-pk-yellow p-4"><p className="font-bold text-pk-yellow">Keep your OneMusic licence.</p><p className="text-sm opacity-90">The Pack doesn't replace it until APRA AMCOS confirms in writing.</p></div>
        <div className="rounded-2xl bg-pk-white/10 p-4"><p className="font-bold">Want customers to see what's playing?</p><p className="text-sm opacity-80 mt-1">Print your QR sign kit from <Link to="/biz/site" className="underline font-semibold">My site</Link> — A5 sign, window sticker or table card for the bar or counter.</p></div>
      </aside>
    </div>
  </div>;
}

/* B4 */
export function BizPlan() {
  const [stripe, setStripe] = useState(false);
  return <BizDesk>
    <PageTitle eyebrow="My plan" title="Your plan" />
    <TrialNote />
    <button className="pk-btn mb-4" onClick={() => setStripe(true)}>Manage payment card</button>
    {stripe && <p role="status" className="mb-4">Stripe payment-card hand-off opened (simulated). Card details are managed by Stripe.</p>}
    <Card className="max-w-2xl">
      <p className="pk-h2">$49.99 per site, per month.</p>
      <p className="mt-1">The same price however busy your site gets. This is the pilot price.</p>
      <div className="mt-6"><Bar parts={[{ label: "$34.99 to the artists played at your site", value: 34.99, cls: "grad-hero" }, { label: "$15.00 to The Pack", value: 15, cls: "bg-pk-orange" }]} /></div>
    </Card>
    <Card className="max-w-2xl mt-5"><Chip tone="amber">After the pilot · to be confirmed</Chip><p className="mt-2">Once the pilot ends, pricing will be tiered by annual turnover. We'll tell you well before anything changes.</p></Card>
  </BizDesk>;
}

/* B5 */
export function BizPlaylists() {
  const { state, set } = usePack();
  const [q, setQ] = useState(""); const [shared, setShared] = useState(false); const [posted, setPosted] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<{ name: string; ids: string[] }[]>([]);
  const house = state.houseSongs;
  const lastArtist = house.length ? song(house[house.length - 1]).artist : null;
  const add = (id: string) => set(s => s.houseSongs.includes(id) ? s : { ...s, houseSongs: [...s.houseSongs, id] });
  const listenerSugg = state.suggestions.filter(x => x.business === cafe.slug && x.source === "Listener");
  return <BizDesk>
    <PageTitle eyebrow="Playlists" title="Playlists" />
    <button className="pk-btn mb-4" onClick={() => setCreating(true)}>New playlist</button>
    {creating && <Card className="mb-5">
      <label className="pk-label">Playlist name<input className="pk-input" value={name} onChange={e => setName(e.target.value)} /></label>
      <p>No artist twice in a row. No repeat within 3 hours.</p>
      <ol className="my-3">{selected.map(id => <li key={id}>{song(id).title}</li>)}</ol>
      <ul>{songs.map(track => { const blocked = selected.includes(track.id) || (!!selected.length && song(selected[selected.length - 1]).artist === track.artist); return <li key={track.id} className="flex justify-between gap-3 my-2"><span>{track.title} · {artistOf(track).name}</span><button className="pk-btn pk-btn-ghost" disabled={blocked} onClick={() => setSelected(ids => [...ids, track.id])}>Add song</button></li>; })}</ul>
      <button className="pk-btn mt-3" disabled={!name.trim() || !selected.length} onClick={() => { setPlaylists(items => [...items, { name: name.trim(), ids: selected }]); setCreating(false); setName(""); setSelected([]); }}>Save playlist</button>
      <button className="pk-btn pk-btn-ghost ml-3" onClick={() => { setCreating(false); setName(""); setSelected([]); }}>Cancel</button>
    </Card>}
    {playlists.map((playlist, index) => <Card key={index} className="mb-4"><h2 className="pk-h3">{playlist.name}</h2><p>Curated by {state.staffName}</p><ol>{playlist.ids.map(id => <li key={id}>{song(id).title} · {artistOf(song(id)).name}</li>)}</ol></Card>)}
    <Card className="mb-5"><div className="flex justify-between items-start flex-wrap gap-2"><div><h2 className="pk-h3">Weekday morning, café · v3</h2><p className="text-sm">Curated by Alex &amp; The Pack</p></div>{state.bizActive === "pack" ? <Chip tone="pink">Playing now</Chip> : <button className="pk-btn pk-btn-ghost" onClick={() => set(s => ({ ...s, bizActive: "pack" }))}>Switch back to this</button>}</div>
      <p className="text-sm mt-2 text-muted-foreground">{PACK_LIST.map(id => song(id).title).join(" · ")}</p>
      <div className="mt-3"><button className="pk-btn pk-btn-ghost" onClick={() => setPosted("pack")}>Share this playlist to your socials</button>
        {posted === "pack" && <p className="text-sm mt-2">Posted to {cafe.name}'s socials with today's track list, credited to the Pack curators. <span className="text-muted-foreground">(Simulated in the pilot.)</span></p>}</div></Card>
    <div className="grid lg:grid-cols-2 gap-5">
      <Card><div className="flex justify-between flex-wrap gap-2"><div><h2 className="pk-h3">House picks</h2><p className="text-sm">Curated by {state.staffName} for {cafe.name}</p></div>{state.bizActive === "house" ? <Chip tone="pink">Playing now</Chip> : <button className="pk-btn" disabled={!house.length} onClick={() => set(s => ({ ...s, bizActive: "house" }))}>Play this playlist instead</button>}</div>
        <div className="flex gap-2 mt-2 flex-wrap"><Chip tone="green">No artist twice in a row</Chip><Chip tone="green">No repeat within 3 hours</Chip></div>
        <ol className="mt-3 space-y-2">{house.map(id => <li key={id} className="flex justify-between"><span><b>{song(id).title}</b> · {artistOf(song(id)).name}</span><button className="text-sm underline" onClick={() => set(s => ({ ...s, houseSongs: s.houseSongs.filter(x => x !== id) }))}>Remove</button></li>)}</ol>
        <label className="pk-label mt-4">Search the Pack catalogue<input className="pk-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Song or artist" /></label>
        <ul className="space-y-1">{songs.filter(s => !house.includes(s.id) && (s.title + artistOf(s).name).toLowerCase().includes(q.toLowerCase())).map(s => {
          const blocked = s.artist === lastArtist;
          return <li key={s.id} className="flex justify-between items-center"><span>{s.title} · {artistOf(s).name}</span><button className="pk-chip pk-chip-blue disabled:opacity-40" disabled={blocked} title={blocked ? "Same artist as the last song" : ""} onClick={() => add(s.id)}>{blocked ? "Same artist" : "Add"}</button></li>;
        })}</ul>
        <button className="pk-btn pk-btn-ghost mt-4" onClick={() => setShared(true)}>Share this playlist</button>
        {shared && <p className="text-sm mt-2">Shared with other Pack businesses and The Pack, credited to {state.staffName}.</p>}
        <button className="pk-btn pk-btn-ghost mt-2" onClick={() => setPosted("house")}>Share this playlist to your socials</button>
        {posted === "house" && <p className="text-sm mt-2">Posted to {cafe.name}'s socials with today's track list, credited to {state.staffName}. <span className="text-muted-foreground">(Simulated in the pilot.)</span></p>}
      </Card>
      <Card><h2 className="pk-h3">Suggested by listeners</h2><p className="text-sm text-muted-foreground">Your Pack curator sees these too. Either of you can add one; nothing plays on its own.</p>
        <ul className="mt-3 space-y-3">{listenerSugg.map(sg => <li key={sg.id} className="flex justify-between items-center gap-2"><div><b>{song(sg.songId).title}</b> · {artistOf(song(sg.songId)).name}{sg.note && <p className="text-sm text-muted-foreground">“{sg.note}”</p>}</div>
          <button className="pk-chip pk-chip-blue" disabled={house.includes(sg.songId)} onClick={() => add(sg.songId)}>{house.includes(sg.songId) ? "Added" : "Add"}</button></li>)}</ul>
      </Card>
    </div>
  </BizDesk>;
}

export function BizStaff() {
  const { state } = usePack();
  return <BizDesk>
    <PageTitle eyebrow="Staff" title="Staff">Staff can run the player and build house picks. They can't change the profile or the plan.</PageTitle>
    <Card className="max-w-xl"><table className="pk-table"><thead><tr><th>Name</th><th>Can do</th></tr></thead><tbody>
      <tr><td>{state.staffName}</td><td>Player, house picks</td></tr><tr><td>Owner (you)</td><td>Everything</td></tr></tbody></table>
      <label className="pk-label mt-4">Invite staff by email<input className="pk-input" placeholder="staff@example.com" /></label><button className="pk-btn">Send invite</button></Card>
  </BizDesk>;
}
