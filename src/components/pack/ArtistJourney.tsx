import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { Card, Chip, Desk, MetaGenBand, PageTitle } from "./kit";
import { startReceive, type ReceiveProgress } from "@/lib/metagen-receive";
import { usePack, type ReleaseStatus } from "@/lib/pack-store";
import { cn } from "@/lib/utils";

const MENU = [
  { to: "/artist-portal", label: "Dashboard" }, { to: "/artist-portal/join", label: "Join & checklist" }, { to: "/artist-portal/profile", label: "Your profile" },
  { to: "/artist-portal/agreement", label: "Artist Agreement" }, { to: "/artist-portal/upload", label: "Add your music" }, { to: "/artist-portal/status", label: "Release status" },
  { to: "/artist-portal/splits", label: "Who gets paid" }, { to: "/artist-portal/statement", label: "Earnings statement" },
];
function ArtistDesk({ children }: { children: React.ReactNode }) { return <Desk area="Artist · The Southerlies" grad="grad-pp" menu={MENU}><nav aria-label="Artist support" className="mb-4"><a href="/contact" className="underline font-semibold">Contact The Pack</a></nav>{children}</Desk>; }

export const STATUSES: ReleaseStatus[] = ["Received", "Checking", "Needs attention", "In review", "Live"];
export function StatusChip({ s }: { s: ReleaseStatus }) {
  const tone = s === "Withdrawn" ? "dark" : s === "Live" ? "green" : s === "Needs attention" ? "red" : s === "In review" ? "blue" : "amber";
  return <Chip tone={tone}>{s}</Chip>;
}

const RULES = ["1. The Pack is owned by its members. Full members (artists) have one vote each on how it is run.", "2. Members agree to act in good faith and treat each other with respect.", "3. Surplus is shared as set out in the revenue policy: 70% to artists, 30% to run The Pack.", "4. Members can leave at any time. Your music and data leave with you.", "5. Changes to these rules need a vote of Full members at a general meeting.", "6. Disputes are first raised with the board, then an independent mediator."];

/* C1 */
export function ArtistJoin() {
  const { state, set } = usePack();
  const a = state.artist;
  const [email, setEmail] = useState(""); const [terms, setTerms] = useState(false); const [rules, setRules] = useState(false);
  const [consent, setConsent] = useState(false);
  const [connected, setConnected] = useState(false);
  const step = !a.account ? 1 : !a.coop ? 2 : !connected ? 3 : 4;
  return <ArtistDesk>
    <Chip tone="dark">You've been invited to The Pack · Living Labs pilot · Fremantle 1</Chip>
    <PageTitle eyebrow={`Step ${step} of 4`} title="Join The Pack" />
    {step === 1 && <Card className="max-w-lg">
      <h2 className="pk-h3">Create your account</h2>
      <label className="pk-label mt-3">Email<input className="pk-input" value={email} onChange={e => setEmail(e.target.value)} type="email" /></label>
      <label className="pk-label">Password (or skip and we'll email you a link)<input className="pk-input" type="password" /></label>
      <label className="pk-check"><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} /> I accept the Terms and the Privacy Policy</label>
      <button className="pk-btn mt-4" disabled={!terms || !/\S+@\S+/.test(email)} onClick={() => set(s => ({ ...s, artist: { ...s.artist, account: true } }))}>Create account</button>
    </Card>}
    {step === 2 && <Card className="max-w-2xl">
      <h2 className="pk-h3">Join the co-op</h2><p className="mt-1">Artists join as Full members, which means a vote in how The Pack is run.</p>
      <div className="h-44 overflow-y-auto border-2 border-pk-black rounded-xl p-3 my-4 text-sm space-y-2 bg-pk-cream"><p className="font-bold">Co-op Rules</p>{RULES.map(r => <p key={r}>{r}</p>)}</div>
      <label className="pk-check"><input type="checkbox" checked={rules} onChange={e => setRules(e.target.checked)} /> I accept the Co-op Rules and join as a Full member</label>
      <label className="pk-check mt-3 text-sm font-normal"><input type="checkbox" /> Optional: include my aggregate data in an Open data project supporting the health of the music industry, research and government decisions. Saying no never blocks joining.</label>
      <button className="pk-btn mt-4" disabled={!rules} onClick={() => set(s => ({ ...s, artist: { ...s.artist, coop: true } }))}>Join the co-op</button>
    </Card>}
    {step === 3 && <Card className="max-w-lg">
      <h2 className="pk-h3">Connect your MetaGen Creator ID</h2>
      <label className="pk-check mt-4"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> I consent to MetaGen sharing my profile, identifiers, track details and splits with The Pack.</label>
      <button className="pk-btn mt-4" disabled={!consent} onClick={() => setConnected(true)}>Connect MetaGen Creator ID (simulated)</button>
    </Card>}
    {step === 4 && <Card className="max-w-lg">
      <h2 className="pk-h3">Welcome, you're a Full member</h2><p className="text-sm mt-1">MetaGen Creator ID connected (simulated). Three things to get your music on.</p>
      <ul className="mt-4 space-y-3">
        <CheckItem done={a.profile} to="/artist-portal/profile" label="Your profile" />
        <CheckItem done={!!a.agreementDate} to="/artist-portal/agreement" label="Artist Agreement" />
        <CheckItem done={false} locked={!(a.profile && a.agreementDate)} to="/artist-portal/upload" label="Add your music" />
      </ul>
      <p className="text-sm mt-4">Want a richer public page? <Link to="/membership" className="underline font-semibold">Band Page, $10 / month</Link> (optional).</p>
    </Card>}
  </ArtistDesk>;
}
function CheckItem({ done, locked, to, label }: { done: boolean; locked?: boolean; to: string; label: string }) {
  const inner = <><span className={cn("w-7 h-7 rounded-full grid place-items-center border-2 border-pk-black", done ? "bg-pk-green" : "bg-pk-white")}>{done ? <Check size={16} /> : locked ? <Lock size={14} /> : null}</span><span className="font-bold flex-1">{label}</span><span className="text-sm">{done ? "Done" : locked ? "Locked until the first two are done" : "Start"}</span></>;
  return <li>{locked ? <div className="flex gap-3 items-center opacity-50">{inner}</div> : <Link to={to} className="flex gap-3 items-center hover:underline">{inner}</Link>}</li>;
}

/* C2 */
const REGIONS = ["Perth", "Fremantle", "Peel", "South West", "Margaret River", "Great Southern", "Wheatbelt", "Mid West", "Goldfields-Esperance", "Pilbara", "Kimberley", "Gascoyne"];
export function ArtistProfileEdit() {
  const { state, set } = usePack(); const nav = useNavigate();
  const [f, setF] = useState(state.artist);
  const u = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return <ArtistDesk>
    <PageTitle eyebrow="Checklist" title="Your profile" />
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
      <Card>
        <label className="pk-label">Public display name<input className="pk-input" value={f.displayName} onChange={u("displayName")} /></label>
        <label className="pk-label">Legal name <Chip tone="amber">Only The Pack sees this</Chip><input className="pk-input" value={f.legalName} onChange={u("legalName")} /></label>
        <label className="pk-label">Home region<select className="pk-input" value={f.region} onChange={u("region")}>{REGIONS.map(r => <option key={r}>{r}</option>)}</select></label>
        <label className="pk-label">Short bio and story<textarea className="pk-input" rows={3} value={f.bio} onChange={u("bio")} /></label>
        <label className="pk-label">Links<input className="pk-input" value={f.links} onChange={u("links")} /></label>
        <label className="pk-label">Photo (optional)<div className="pk-input border-dashed text-center py-5 text-muted-foreground">Drop a photo here</div></label>
        <button className="pk-btn" disabled={!f.displayName || !f.legalName} onClick={() => { set(s => ({ ...s, artist: { ...f, profile: true } })); nav({ to: "/artist-portal/join" }); }}>Save profile</button>
      </Card>
      <div><p className="pk-eyebrow mb-2">What listeners see</p>
        <div className="pk-card p-0 overflow-hidden"><div className="grad-pp p-5 text-pk-white"><h2 className="pk-h2">{f.displayName || "Your name"}</h2><Chip tone="dark" className="mt-2">{f.region}</Chip></div><p className="p-4">{f.bio}</p></div>
        <p className="text-sm mt-2 text-muted-foreground">Your legal name is never shown here.</p>
      </div>
    </div>
  </ArtistDesk>;
}

/* C3 */
export function ArtistAgreement() {
  const { state, set } = usePack(); const nav = useNavigate();
  const [ok, setOk] = useState(false);
  const blocks: [string, string][] = [
    ["Permission to stream", "You let The Pack play your recordings in participating businesses and to Pack listeners. You can withdraw a release at any time."],
    ["Licence-back", "You let The Pack stream your songs under your own APRA AMCOS membership, and The Pack pays you directly."],
    ["How you're paid", "70% of every dollar The Pack collects goes to the artists played — from each business and listener membership. Payouts start at a $10 balance. During the pilot, earnings and payouts are simulated."],
    ["Your data stays yours", "Export all of your data whenever you like. We will never sell it. You see listening counts, plus the names of listeners who choose to follow you publicly — so you can find your fans and reach your community."],
  ];
  return <ArtistDesk>
    <PageTitle eyebrow="Checklist" title="Artist Agreement">The short version, in plain English.</PageTitle>
    <div className="grid md:grid-cols-2 gap-4 max-w-4xl">{blocks.map(([h, p]) => <Card key={h}><h2 className="pk-h3">{h}</h2><p className="mt-1">{p}</p></Card>)}</div>
    <div className="flex gap-3 mt-5 flex-wrap"><a href="/artist-portal/agreement-full" className="pk-btn pk-btn-ghost">Read the full agreement</a><button className="pk-btn pk-btn-ghost">Download a copy</button></div>
    {state.artist.agreementDate ? <p className="mt-5 font-bold">You agreed on {state.artist.agreementDate}.</p> : <>
      <label className="pk-check mt-5"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} /> I have read the agreement and I agree</label>
      <button className="pk-btn mt-4" disabled={!ok} onClick={() => { set(s => ({ ...s, artist: { ...s.artist, agreementDate: new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) } })); nav({ to: "/artist-portal/join" }); }}>Agree and continue</button>
    </>}
  </ArtistDesk>;
}

/* C4 */
export function ArtistUpload() {
  const { state, set } = usePack();
  const unlocked = state.artist.coop && state.artist.profile && !!state.artist.agreementDate;
  const [p, setP] = useState<ReceiveProgress>({ receivedMb: 412, totalMb: 1100, done: false });
  const [submitted, setSubmitted] = useState<string | null>(null);
  useEffect(() => startReceive(setP), []);
  const submit = () => {
    const id = crypto.randomUUID();
    set(s => ({ ...s, releases: [{ id, title: "Long Way Down (single)", version: 1, status: "Received" }, ...s.releases] }));
    setSubmitted(id);
    const move = (st: ReleaseStatus, ms: number) => setTimeout(() => set(s => ({ ...s, releases: s.releases.map(r => r.id === id ? { ...r, status: st } : r) })), ms);
    move("Checking", 2000); move("In review", 4500);
  };
  const pct = Math.round((p.receivedMb / p.totalMb) * 100);
  return <ArtistDesk>
    <PageTitle eyebrow="Checklist" title="Add your music" />
    {!unlocked && <div className="pk-trial">Adding music needs Full membership. {!state.artist.coop && <><Link to="/artist-portal/join" className="underline">Accept the Co-op Rules</Link>, then </>}finish <Link to="/artist-portal/profile" className="underline">your profile</Link> and the <Link to="/artist-portal/agreement" className="underline">Artist Agreement</Link>.</div>}
    <Card className="max-w-2xl mb-5"><h2 className="pk-h3">Getting your release here</h2>
      <ol className="grid sm:grid-cols-4 gap-2 mt-3">{["Get MetaGen", "Prepare your release", "Check it's ready", "Send to The Pack"].map((t, i) => <li key={t} className="rounded-xl border border-current/20 p-3"><p className="pk-eyebrow">Step {i + 1}</p><p className="font-bold text-sm">{t}</p></li>)}</ol>
      <p className="text-sm mt-3 font-semibold">Ready means:</p>
      <ul className="text-sm list-disc pl-5">{["Mastered audio files (WAV)", "Artwork (3000 × 3000 px)", "ISRC for every track", "AI use answered", "Genre and mood tags"].map(x => <li key={x}>{x}</li>)}</ul></Card>
    <MetaGenBand>Songs, contributors, splits and the release package are prepared in MetaGen. Use Transfer to The Pack in MetaGen to send it here.</MetaGenBand>
    <Card className="max-w-2xl">
      <div className="flex justify-between items-center flex-wrap gap-2"><p className="font-mono font-bold">long-way-down_release.zip</p>{p.done ? <Chip tone="green">Arrived</Chip> : <Chip tone="amber">Receiving</Chip>}</div>
      <p className="mt-2 text-sm">Arriving from MetaGen · {p.receivedMb >= 1000 ? `${(p.receivedMb / 1000).toFixed(1)} GB` : `${p.receivedMb} MB`} of 1.1 GB</p>
      <div className="h-3 rounded-full bg-muted mt-2 border border-pk-black overflow-hidden"><div className="h-full grad-pp transition-all" style={{ width: `${pct}%` }} /></div>
      <p className="text-sm mt-2 text-muted-foreground">Sent from MetaGen. If the transfer drops, it should pick up again on its own (to be confirmed with MetaGen).</p>
    </Card>
    <Card className="max-w-2xl mt-5">
      <h2 className="pk-h3">Rights and ownership</h2>
      <p className="mt-2 text-sm">Rights positions and contributor splits are captured through our MetaGen partnership, not here. There's nothing to declare on The Pack — just send the release across.</p>
      <button className="pk-btn mt-4" disabled={!p.done || !unlocked || !!submitted} onClick={submit}>Submit release</button>
    </Card>
    <h2 className="pk-h2 mt-8 mb-3">Recent releases</h2>
    <ReleaseList />
  </ArtistDesk>;
}
function ReleaseList({ withdraw }: { withdraw?: boolean }) {
  const { state, set } = usePack();
  const [confirm, setConfirm] = useState<string | null>(null);
  return <div className="space-y-2 max-w-2xl">{state.releases.map(r => <div key={r.id} className="pk-card py-3 flex justify-between items-center gap-2 flex-wrap">
    <span className="font-bold">{r.title} <span className="font-normal text-sm">v{r.version}</span></span>
    <span className="flex gap-2 items-center"><StatusChip s={r.status} />
      {withdraw && r.status !== "Withdrawn" && (confirm === r.id ? <><span className="text-sm">Withdraw? It leaves all players and playlists within five minutes; its history stays.</span><button className="pk-chip pk-chip-red" onClick={() => { set(s => ({ ...s, releases: s.releases.map(x => x.id === r.id ? { ...x, status: "Withdrawn" } : x) })); setConfirm(null); }}>Yes, withdraw</button><button className="text-sm underline" onClick={() => setConfirm(null)}>Keep</button></> : <button className="text-sm underline" onClick={() => setConfirm(r.id)}>Withdraw a release</button>)}
    </span></div>)}</div>;
}

/* C5 */
export function ArtistStatus() {
  const reached = 3; // Received, Checking, Needs attention
  return <ArtistDesk>
    <PageTitle eyebrow="Release status" title="Kestrel Road EP, version 1" />
    <ol className="flex flex-wrap gap-2 md:gap-0 max-w-4xl">{STATUSES.map((s, i) => <li key={s} className="flex-1 min-w-[8rem] flex items-center gap-2">
      <span className={cn("w-8 h-8 rounded-full grid place-items-center border-2 border-pk-black font-bold", i < reached ? (s === "Needs attention" ? "bg-pk-orange text-pk-white" : "bg-pk-green") : "bg-pk-white")}>{i < reached ? <Check size={16} /> : i + 1}</span>
      <span className={cn("font-semibold text-sm", i >= reached && "opacity-50")}>{s}</span>
    </li>)}</ol>
    <div className="grid gap-3 mt-6 max-w-3xl">
      <div className="rounded-2xl border-2 border-pk-orange bg-pk-orange/10 p-4"><Chip tone="red">Can't continue · E204</Chip><p className="mt-2">Track 3, “Long Way Down”, is missing its audio file. Add the file to the release and send it again.</p></div>
      <div className="rounded-2xl border-2 border-pk-yellow bg-pk-yellow/20 p-4"><Chip tone="amber">On hold · E520</Chip><p className="mt-2">The ISRC for track 2 is already in the catalogue. A person will check whether this is a re-release or a mix-up, usually within two working days.</p></div>
      <div className="rounded-2xl border-2 border-pk-black/20 p-4"><Chip>Note · E730</Chip><p className="mt-2">We measured this track's loudness ourselves and levelled it. No action needed.</p></div>
    </div>
    <div className="flex gap-3 mt-5 flex-wrap"><button className="pk-btn">Send the corrected release</button><button className="pk-btn pk-btn-ghost">Need a hand?</button></div>
    <p className="text-sm mt-2">Sending again creates version 2. Nothing you sent before is deleted.</p>
    <div className="max-w-3xl"><MetaGenBand>Song-detail, split and audio problems are fixed in MetaGen, then the release is sent again. Problems on The Pack's side are fixed by a Pack admin.</MetaGenBand></div>
  </ArtistDesk>;
}

/* C6 */
export function ArtistSplits() {
  const [state, setState] = useState<"open" | "confirmed" | "paused">("open");
  return <ArtistDesk>
    <PageTitle eyebrow="Who gets paid" title="Who gets paid for Night Bus" />
    <Card className="max-w-3xl overflow-x-auto"><table className="pk-table"><thead><tr><th>Person</th><th>Role</th><th>Share</th><th>Account</th></tr></thead><tbody>
      <tr><td className="font-bold">Sam Reilly</td><td>Writer and performer</td><td>60%</td><td><Chip tone="green">Has account</Chip></td></tr>
      <tr><td className="font-bold">Jo Tan</td><td>Writer</td><td>40%</td><td><Chip tone="amber">Not on The Pack yet</Chip></td></tr>
      <tr><td className="font-black">Total</td><td /><td className="font-black">100%</td><td /></tr></tbody></table>
      <p className="mt-3 text-sm">Jo's share is held for Jo. We'll invite Jo to claim it. Nobody's share is lost.</p></Card>
    {state === "open" ? <div className="flex gap-3 mt-5"><button className="pk-btn" onClick={() => setState("confirmed")}>Confirm who gets paid</button><button className="pk-btn pk-btn-ghost" onClick={() => setState("paused")}>Something's wrong</button></div>
      : <p className="mt-5 font-bold">{state === "confirmed" ? "Confirmed. Thanks." : "Release paused. Fix the details in MetaGen and send it again."}</p>}
    <div className="max-w-3xl"><MetaGenBand>Splits come from the contributor details entered in MetaGen. To change them, fix them in MetaGen and send the release again.</MetaGenBand></div>
  </ArtistDesk>;
}

/* C7 */
export function ArtistDashboard() {
  const { state, money } = usePack();
  const [exported, setExported] = useState(false); const [erase, setErase] = useState(false);
  return <ArtistDesk>
    <PageTitle eyebrow="The Southerlies" title="Welcome back" />
    {state.testMode && <div className="pk-trial">Money is notional. Money figures carry a simulated label and no payout is made.</div>}
    <div className="grid md:grid-cols-3 gap-4">
      <Card><p className="pk-eyebrow">Played this month</p><p className="pk-h2 mt-1">142 plays across 3 businesses</p></Card>
      <Card><p className="pk-eyebrow">Earned this month</p><p className="pk-h2 mt-1">{money(9.32)}</p><Link to="/artist-portal/statement" className="text-sm underline">See the August statement</Link></Card>
      <Card><p className="pk-eyebrow">Followers</p><p className="pk-h2 mt-1">34</p><p className="text-sm">21 chose to follow publicly and are shown below. The other 13 follow quietly, counted here and never named.</p>
        <div className="flex gap-1 flex-wrap mt-2">{["Mia", "Tom R.", "Priya"].map(n => <Chip key={n}>{n}</Chip>)}<Chip tone="dark">+ 18 more</Chip></div></Card>
    </div>
    <h2 className="pk-h2 mt-8 mb-3">Your releases</h2>
    <ReleaseList withdraw />
    <div className="pk-card mt-8 max-w-2xl grad-cy"><h2 className="pk-h3">Your data is yours</h2><p className="mt-1">Take everything with you, any time.</p>
      <div className="flex gap-3 mt-3 flex-wrap"><button className="pk-btn" onClick={() => setExported(true)}>Export my data</button><button className="pk-btn pk-btn-ghost" onClick={() => setErase(true)}>Request account and data erasure</button></div>{exported && <p className="text-sm mt-2 font-semibold">Your export is being prepared. We'll email a download link.</p>}
      {erase && <p className="text-sm mt-2 font-semibold">Request sent to The Pack team. We'll reply within 30 days. Payment and ledger records are kept as the law requires.</p>}</div>
    <p className="text-sm mt-6">Optional: <Link to="/membership" className="underline font-semibold">Band Page, $10 / month</Link>.</p>
  </ArtistDesk>;
}

/* C8 */
export function ArtistStatement() {
  const { state } = usePack();
  const sim = state.testMode ? " (simulated)" : "";
  const [working, setWorking] = useState(false);
  const [venues, setVenues] = useState(false);
  const [stripe, setStripe] = useState(false);
  return <ArtistDesk>
    <PageTitle eyebrow="Earnings statement" title="August 2026" />
    {state.testMode && <><Chip tone="pink">SIMULATED</Chip><p className="mt-2 font-semibold">No money moves. This is what the ledger would have paid.</p></>}
    <Card className="mt-4 overflow-x-auto max-w-4xl"><table className="pk-table"><thead><tr><th>Song / venue</th><th>Details</th><th>Plays</th><th>Song total</th><th>Your split</th><th>You earned</th></tr></thead><tbody>
      <tr><td><button className="underline font-bold" aria-expanded={venues} onClick={() => setVenues(value => !value)}>Night Bus {venues ? "−" : "+"}</button></td><td>All venues</td><td>90</td><td>$15.74{sim}</td><td>60%</td><td className="font-bold">$9.44{sim} <button className="text-sm underline font-normal ml-1" onClick={() => setWorking(!working)}>{working ? "Hide working" : "Show working"}</button></td></tr>
      {venues && <tr><td>Example Café</td><td>Night Bus</td><td>90 of 200</td><td>$15.74{sim}</td><td>60%</td><td>$9.44{sim}</td></tr>}
      {working && <tr><td colSpan={6}><ul className="text-sm space-y-1">
        <li>Site pool: Example Café paid $49.99{sim}; 70% to artists = $34.99{sim}</li>
        <li>Qualifying plays at the site: 200 · Night Bus: 90 → $15.74{sim}</li>
        <li>Confirmed split (from MetaGen): The Southerlies 60% → $9.44{sim}</li></ul></td></tr>}</tbody></table></Card>
    <section className="mt-5"><h2 className="pk-h3">Payouts · Phase 2</h2><button className="pk-btn mt-3" onClick={() => setStripe(true)}>Set up payouts with Stripe</button>{stripe && <p role="status" className="mt-2">Stripe payout setup opened (simulated). The Pack never holds bank numbers.</p>}</section>
    <div className="flex gap-4 items-center mt-5 flex-wrap"><button className="pk-btn pk-btn-ghost">Download CSV</button><p className="font-bold">Balance $9.44{sim}. Would be payable at the next posting once it reaches $10 — no money moves during the pilot.</p></div>
  </ArtistDesk>;
}
