import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";
import { Card, Chip, Desk, OnAir, PageTitle } from "./kit";
import { artistOf, businesses, song, songs, usePack, PEOPLE } from "@/lib/pack-store";
import { cn } from "@/lib/utils";
import { PlaybackAnalytics } from "./PlaybackAnalytics";

const MENU = [
  { to: "/admin", label: "Dashboard" }, { to: "/admin/review", label: "Review queue" }, { to: "/admin/playlists", label: "Playlists" },
  { to: "/admin/sites", label: "Sites" }, { to: "/admin/users", label: "Users" }, { to: "/admin/policy", label: "Policy" }, { to: "/admin/payments", label: "Payments" }, { to: "/admin/audit", label: "Audit log" },
];
function AdminDesk({ children }: { children: React.ReactNode }) { return <Desk area="Curator & admin" grad="grad-bg" menu={MENU}>{children}</Desk>; }

export function AdminDashboard() {
  const { state } = usePack();
  return <AdminDesk>
    <PageTitle eyebrow={`Signed in as ${PEOPLE.admin} (admin)`} title="Dashboard" />
    <div className="grid md:grid-cols-3 gap-4">
      <Link to="/admin/review" className="pk-card"><p className="pk-eyebrow">Review queue</p><p className="pk-h2">1 release</p><p className="text-sm">Kestrel Road (EP), version 2</p></Link>
      <Link to="/admin/sites" className="pk-card"><p className="pk-eyebrow">Sites</p><p className="pk-h2">2 of 3 on air</p></Link>
      <Link to="/admin/policy" className="pk-card"><p className="pk-eyebrow">Test mode</p><p className="pk-h2">{state.testMode ? "On" : "Off"}</p></Link>
    </div>
    <PlaybackAnalytics />
  </AdminDesk>;
}

/* D1 */
export function AdminUsers() {
  const { state, set, log } = usePack();
  const [a, setA] = useState({ email: "", cohort: "Fremantle 1" }); const [b, setB] = useState({ email: "", name: "" }); const [link, setLink] = useState("");
  const invite = (person: string, role: "Artist" | "Business", cohort: string) => {
    set(s => ({ ...s, invites: [{ id: crypto.randomUUID(), person, role, cohort, status: "Invited" }, ...s.invites] }));
    log(PEOPLE.admin, `Invited ${role.toLowerCase()} ${person} (${cohort})`);
    setLink(`thepack.example/join/${Math.random().toString(36).slice(2, 10)}`);
  };
  const act = (id: string, what: string) => {
    const inv = state.invites.find(i => i.id === id)!;
    if (what === "Deactivate") set(s => ({ ...s, invites: s.invites.map(i => i.id === id ? { ...i, status: "Deactivated" } : i) }));
    log(PEOPLE.admin, `${what}: ${inv.person}`);
  };
  return <AdminDesk>
    <PageTitle eyebrow="Users" title="Users" />
    <div className="grid md:grid-cols-2 gap-5">
      <Card><h2 className="pk-h3">Invite an artist</h2>
        <label className="pk-label mt-2">Email<input className="pk-input" value={a.email} onChange={e => setA({ ...a, email: e.target.value })} /></label>
        <label className="pk-label">Cohort label<input className="pk-input" value={a.cohort} onChange={e => setA({ ...a, cohort: e.target.value })} /></label>
        <button className="pk-btn" disabled={!/\S+@\S+/.test(a.email)} onClick={() => { invite(a.email, "Artist", a.cohort); setA({ ...a, email: "" }); }}>Create invite link</button></Card>
      <Card><h2 className="pk-h3">Invite a business</h2>
        <label className="pk-label mt-2">Email<input className="pk-input" value={b.email} onChange={e => setB({ ...b, email: e.target.value })} /></label>
        <label className="pk-label">Business name<input className="pk-input" value={b.name} onChange={e => setB({ ...b, name: e.target.value })} /></label>
        <button className="pk-btn" disabled={!/\S+@\S+/.test(b.email) || !b.name} onClick={() => { invite(b.email, "Business", b.name); setB({ email: "", name: "" }); }}>Create invite link</button></Card>
    </div>
    {link && <p className="mt-3 font-semibold">Single-use link created: <span className="font-mono">{link}</span></p>}
    <Card className="mt-6 overflow-x-auto"><table className="pk-table"><thead><tr><th>Person</th><th>Role</th><th>Cohort</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {state.invites.map(i => <tr key={i.id}><td>{i.person}</td><td>{i.role}</td><td>{i.cohort}</td><td><Chip tone={i.status === "Joined" ? "green" : i.status === "Deactivated" ? "red" : "amber"}>{i.status}</Chip></td>
        <td className="space-x-2 whitespace-nowrap">{["Remind", "Resend", "Deactivate"].map(x => <button key={x} className="text-sm underline" disabled={i.status === "Deactivated"} onClick={() => act(i.id, x)}>{x}</button>)}</td></tr>)}
    </tbody></table></Card>
    <Card className="mt-6 overflow-x-auto"><div className="flex justify-between items-center flex-wrap gap-2"><h2 className="pk-h3">Member register</h2><button className="pk-btn pk-btn-ghost" onClick={() => log(PEOPLE.admin, "Exported member register")}>Export CSV</button></div>
      <table className="pk-table mt-2"><thead><tr><th>Member</th><th>Class</th><th>Rules version</th><th>Accepted</th><th>Status</th></tr></thead><tbody>
        {REGISTER.map(r => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td><Chip tone={r[4] === "Active" ? "green" : "amber"}>{r[4]}</Chip></td></tr>)}
      </tbody></table></Card>
  </AdminDesk>;
}
const REGISTER = [["The Southerlies", "Full (artist)", "1.0", "2 Sep 2026", "Active"], ["Example Café", "Associate (business)", "1.0", "3 Sep 2026", "Active"], ["Mia L.", "Associate (listener)", "1.0", "5 Sep 2026", "Active"], ["Corner Books", "Associate (business)", "—", "—", "Pending"]];

/* D2 */
const REVIEW_TRACKS = ["kestrel-road", "tide-tables", "long-way-down"];
export function AdminReview() {
  const { log, set } = usePack();
  const [role, setRole] = useState<"admin" | "curator">("admin");
  const [played, setPlayed] = useState<string[]>([]); const [playing, setPlaying] = useState<string | null>(null);
  const [reason, setReason] = useState(""); const [done, setDone] = useState<string | null>(null);
  const allPlayed = REVIEW_TRACKS.every(t => played.includes(t));
  const decide = (d: "Approved" | "Held" | "Rejected") => {
    log(PEOPLE.admin, `${d} Kestrel Road (EP) v2${reason ? `: ${reason}` : ""}`);
    if (d === "Approved") set(s => ({ ...s, releases: s.releases.map(r => r.title.startsWith("Kestrel") ? { ...r, status: "Live", version: 2 } : r) }));
    setDone(d);
  };
  return <AdminDesk>
    <div className="flex justify-end gap-2 mb-2"><span className="text-sm font-semibold">View as</span>{(["admin", "curator"] as const).map(r => <button key={r} onClick={() => setRole(r)} className={cn("pk-chip", role === r ? "pk-chip-blue" : "pk-chip-soft")}>{r === "admin" ? "Sam (admin)" : "Alex (curator)"}</button>)}</div>
    <PageTitle eyebrow="Review a release" title="Kestrel Road (EP), version 2" />
    <div className="flex gap-2 flex-wrap">{["Files intact", "Audio present", "AI: No on all tracks", "1 hold cleared", "Diff vs version 1"].map(c => <Chip key={c} tone="green">{c}</Chip>)}</div>
    <Card className="mt-5 overflow-x-auto"><table className="pk-table"><thead><tr><th /><th>Track</th><th>AI answer</th><th>Loudness</th><th>Genre</th><th>Explicit</th></tr></thead><tbody>
      {REVIEW_TRACKS.map(id => { const s = song(id); return <tr key={id}><td><button aria-label={`Play ${s.title}`} className="pk-chip pk-chip-blue" onClick={() => { setPlaying(playing === id ? null : id); setPlayed(p => p.includes(id) ? p : [...p, id]); }}>{playing === id ? <Pause size={14} /> : <Play size={14} />}</button></td>
        <td className="font-bold">{s.title} {played.includes(id) && <Chip tone="green">Played</Chip>}</td><td>No</td><td>{s.lufs} LUFS</td><td>{s.genre}</td><td>No</td></tr>; })}
    </tbody></table></Card>
    <Card className="mt-5"><h2 className="pk-h3">Business-fit tags</h2><div className="flex gap-2 flex-wrap mt-2">{["Café", "Low energy", "Vocal-led"].map(t => <Chip key={t}>{t}</Chip>)}</div>
      <p className="text-sm mt-2">Rights are captured through the MetaGen partnership, so there's nothing to review here.</p></Card>
    {role === "admin" ? (done ? <p className="mt-6 font-bold text-lg">{done}. Logged to the audit log{done !== "Approved" ? " and shown to the artist in plain language" : ""}.</p> : <Card className="mt-6">
      <label className="pk-label">Reason (required for Hold and Reject)<textarea className="pk-input" rows={2} value={reason} onChange={e => setReason(e.target.value)} /></label>
      <div className="flex gap-3 flex-wrap"><button className="pk-btn" disabled={!allPlayed} onClick={() => decide("Approved")}>Approve</button><button className="pk-btn pk-btn-ghost" disabled={!reason.trim()} onClick={() => decide("Held")}>Hold</button><button className="pk-btn pk-btn-pink" disabled={!reason.trim()} onClick={() => decide("Rejected")}>Reject</button></div>
      {!allPlayed && <p className="text-sm mt-2">Play every track to enable Approve.</p>}
    </Card>) : <p className="mt-6 text-sm font-semibold">Curators can review but decisions are made by an admin.</p>}
  </AdminDesk>;
}

/* D3 */
export function AdminPlaylists() {
  const { state, log } = usePack();
  const [list, setList] = useState<string[]>(["tide-tables", "slow-water", "paper-boats"]);
  const [genre, setGenre] = useState("Any"); const [energy, setEnergy] = useState("Any");
  const [assign, setAssign] = useState("Example Café"); const [published, setPublished] = useState(false); const [preview, setPreview] = useState(false);
  const matches = songs.filter(s => (genre === "Any" || s.genre === genre) && (energy === "Any" || s.energy === energy));
  const twice = list.some((id, i) => i > 0 && song(id).artist === song(list[i - 1]).artist);
  const repeat = new Set(list).size !== list.length;
  const add = (id: string) => setList(l => [...l, id]);
  const sugg = state.suggestions.filter(s => s.business === "example-cafe");
  return <AdminDesk>
    <PageTitle eyebrow="Build a playlist" title="Weekday morning, café (draft v3)" />
    <div className="grid lg:grid-cols-[14rem_1fr_1.2fr] gap-4">
      <Card><h2 className="pk-h3">Filters</h2>
        <label className="pk-label mt-2">Genre<select className="pk-input" value={genre} onChange={e => setGenre(e.target.value)}>{["Any", "Folk", "Indie"].map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="pk-label">Energy<select className="pk-input" value={energy} onChange={e => setEnergy(e.target.value)}>{["Any", "Low", "Medium", "High"].map(x => <option key={x}>{x}</option>)}</select></label>
        {["Setting", "Region", "Loudness"].map(f => <label key={f} className="pk-label">{f}<select className="pk-input"><option>Any</option></select></label>)}</Card>
      <Card><h2 className="pk-h3">Matches (38)</h2><ul className="mt-2 space-y-2">{matches.map(s => <li key={s.id} className="flex justify-between items-center gap-2"><span><b>{s.title}</b> · {artistOf(s).name} <Chip>{artistOf(s).region}</Chip></span><button className="pk-chip pk-chip-blue" onClick={() => add(s.id)}>Add</button></li>)}</ul><p className="text-xs mt-3 text-muted-foreground">Showing seed songs. Nothing here is ranked.</p></Card>
      <div className="space-y-4">
        <Card><h2 className="pk-h3">Curated by Alex &amp; The Pack</h2>
          <div className="flex gap-2 flex-wrap mt-2"><Chip tone={twice ? "red" : "green"}>No artist twice in a row</Chip><Chip tone={repeat ? "red" : "green"}>No repeat in 3 hours</Chip></div>
          <ol className="mt-3 space-y-1 list-decimal pl-5">{list.map((id, i) => <li key={i}><span className="flex justify-between"><span>{song(id).title} · {artistOf(song(id)).name}</span><button className="text-sm underline" onClick={() => setList(l => l.filter((_, j) => j !== i))}>Remove</button></span></li>)}</ol>
          <button className="pk-btn pk-btn-ghost mt-3" onClick={() => setPreview(!preview)}>{preview ? "Stop preview" : "Preview, levelled"}</button></Card>
        <Card><h2 className="pk-h3">Suggested for this business ({sugg.length})</h2><ul className="mt-2 space-y-2">{sugg.map(s => <li key={s.id} className="flex justify-between items-center gap-2"><span>{song(s.songId).title} <Chip tone={s.source === "Listener" ? "pink" : "soft"}>{s.source}</Chip></span><button className="pk-chip pk-chip-blue" onClick={() => add(s.songId)}>Add</button></li>)}</ul></Card>
        <Card>
          <label className="pk-label">Assign to<select className="pk-input" value={assign} onChange={e => setAssign(e.target.value)}><option>Example Café</option><option>Corner Books</option></select></label>
          <button className="pk-btn" disabled={twice || repeat || published} onClick={() => { log(PEOPLE.curator, `Published Weekday morning, café v3 to ${assign}`); setPublished(true); }}>{published ? "Published" : "Publish new version"}</button>
          <button className="text-sm underline mt-2 block" onClick={() => log(PEOPLE.curator, `Rolled ${assign} back to v2`)}>Roll {assign} back to v2</button>
          <p className="text-sm mt-3">Exposure, last 30 days: Marlo Finch 12 slots, The Southerlies 4 slots. Shown so no artist is favoured by accident.</p></Card>
      </div>
    </div>
  </AdminDesk>;
}

/* D4 */
export function AdminSites() {
  return <AdminDesk>
    <PageTitle eyebrow="Sites" title="Sites"><Chip tone="pink">2 of 3 on air</Chip></PageTitle>
    <Card className="overflow-x-auto"><table className="pk-table"><thead><tr><th>Site</th><th>State</th><th>Last heartbeat</th><th>Playlist</th><th>Skips today</th><th /></tr></thead><tbody>
      {businesses.map(b => <tr key={b.slug}><td className="font-bold">{b.name}</td><td>{b.state === "ON AIR" ? <OnAir small /> : <Chip tone={b.onAir ? "green" : "red"}>{b.state}</Chip>}</td><td>{b.heartbeat}</td>
        <td>{b.onAir ? (b.slug === "example-cafe" ? "Weekday morning, café · v3" : "Quiet pages · v1") : "—"}</td><td>{b.skips}</td><td className="whitespace-nowrap"><div className="flex flex-col items-start gap-1"><button className="pk-chip pk-chip-soft">QR kit</button><button className="pk-chip pk-chip-soft">Contact</button></div></td></tr>)}
    </tbody></table></Card>
    <div className="pk-trial mt-4">Harbour Salon has been silent for 2 hours during its player hours. <button className="underline">Check in with them</button></div>
    <p className="mt-4 font-semibold !text-white">Skip reasons this week: Wrong energy 6, Too loud 3, Doesn't fit tonight 4. Sent to the playlist's curator.</p>
  </AdminDesk>;
}

/* D5 */
export function AdminPolicy() {
  const { state, set, log } = usePack();
  const [edit, setEdit] = useState<string | null>(null); const [val, setVal] = useState("");
  const toggle = (on: boolean) => { if (on === state.testMode) return; set(s => ({ ...s, testMode: on })); log(PEOPLE.admin, "Test mode", state.testMode ? "On" : "Off", on ? "On" : "Off"); };
  const saveSetting = (key: string) => {
    const old = state.settings.find(s => s.key === key)!;
    set(s => ({ ...s, settings: s.settings.map(x => x.key === key ? { ...x, value: val, changed: new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short" }) } : x) }));
    log(PEOPLE.admin, `Changed ${old.label}`, old.value, val); setEdit(null);
  };
  const flag = (k: keyof typeof state.flags, label: string) => { set(s => ({ ...s, flags: { ...s.flags, [k]: !s.flags[k] } })); log(PEOPLE.admin, `Feature flag: ${label}`, state.flags[k] ? "on" : "off", state.flags[k] ? "off" : "on"); };
  return <AdminDesk>
    <PageTitle eyebrow="Policy" title="Policy settings" />
    <div className="pk-card grad-cy">
      <div className="flex justify-between items-center flex-wrap gap-3"><h2 className="pk-h2">Test mode</h2>
        <div className="flex rounded-full border-2 border-pk-black overflow-hidden">{[true, false].map(on => <button key={String(on)} onClick={() => toggle(on)} className={cn("px-5 py-2 font-black", state.testMode === on ? "bg-pk-black text-pk-white" : "bg-pk-white")}>{on ? "On" : "Off"}</button>)}</div></div>
      <p className="mt-2">While on, money is notional. Statements and the artist dashboard carry a 'simulated' label, businesses see a free-trial note, and no payouts are made.</p>
    </div>
    <Card className="mt-5 overflow-x-auto"><table className="pk-table"><thead><tr><th>Setting</th><th>Value</th><th>Last changed</th><th /></tr></thead><tbody>
      {state.settings.map(s => <tr key={s.key}><td className="font-bold">{s.label}</td><td>{edit === s.key ? <input className="pk-input" value={val} onChange={e => setVal(e.target.value)} /> : s.value}</td><td>{s.changed}</td>
        <td className="whitespace-nowrap">{edit === s.key ? <><button className="pk-chip pk-chip-blue" onClick={() => saveSetting(s.key)}>Save</button> <button className="text-sm underline" onClick={() => setEdit(null)}>Cancel</button></> : <button className="text-sm underline" onClick={() => { setEdit(s.key); setVal(s.value); }}>Edit</button>}</td></tr>)}
    </tbody></table></Card>
    <Card className="mt-5"><h2 className="pk-h3">Feature flags</h2><div className="flex gap-2 flex-wrap mt-2">
      {([["player", "Business player"], ["home", "Listener home"], ["map", "Map and gigs"]] as const).map(([k, l]) => <button key={k} onClick={() => flag(k, l)} className={cn("pk-chip", state.flags[k] ? "pk-chip-green" : "pk-chip-red")}>{l} {state.flags[k] ? "on" : "off"}</button>)}</div>
      <p className="text-sm mt-3">{state.audit.find(a => a.what === "Test mode" || a.what.includes("Test mode")) ? `Test mode last switched by ${state.audit.find(a => a.what.includes("Test mode"))!.who}, ${state.audit.find(a => a.what.includes("Test mode"))!.when}.` : ""} Every change is kept in the audit log.</p></Card>
  </AdminDesk>;
}

const FLOWS: { who: string; type: string; price: string; stripe: string; steps: string[]; pilot: string }[] = [
  { who: "Musicians", type: "Payouts", price: "70% of collected fees · $10 minimum balance",
    stripe: "Stripe Connect (Express accounts) · Transfers + Payouts · Phase 2 — not connected in the pilot",
    steps: ["Artist joins free → onboards a Connect account (ID + bank details held by Stripe)", "Plays at sites and by listeners credit the artist ledger", "Monthly run: ledger balance ≥ $10 → transfer to the artist's Connect account", "Stripe pays out to the artist's bank; statement + CSV updated", "Band Page ($10/mo) billed as a separate Stripe subscription"],
    pilot: "Ledger only — balances accrue, no transfers sent" },
  { who: "Listeners", type: "Memberships", price: "$9.99/month · patron add-on $2 / $5 / $10 / $15",
    stripe: "Stripe Billing · Checkout + Customer Portal",
    steps: ["Listener chooses membership (and optional patron level) → Stripe Checkout", "Recurring subscription; card updates and cancellations via Customer Portal", "Webhook (invoice.paid) unlocks membership and records revenue", "Membership share allocated to artists played; patron amount to the music industry development fund"],
    pilot: "Membership marked active with '(simulated)' — no card taken" },
  { who: "Businesses", type: "Subscriptions", price: "$49.99/site/month (pilot) · turnover tiers after the pilot",
    stripe: "Stripe Billing · per-site subscription quantity",
    steps: ["Business signs up → Stripe Checkout for one subscription, quantity = number of sites", "Adding a site increases quantity (prorated)", "Webhook (invoice.paid / payment_failed) keeps the player on air or shows a notice", "Site fees allocated 70% to artists played at that site"],
    pilot: "Free trial note shown — no invoices issued" },
  { who: "Government", type: "Patronage", price: "LGAs by population · State by space/capacity",
    stripe: "Stripe Invoicing · bank transfer / card, net 30",
    steps: ["Agreement set by The Pack team → invoice raised in Stripe", "Council or agency pays by bank transfer or card (PO number on invoice)", "Webhook (invoice.paid) records patronage against the funded spaces", "Funds allocated to artists played and the music industry development fund"],
    pilot: "Invoices drafted only — never sent" },
];

function MonthEnd() {
  const { state, log, money } = usePack();
  const [stage, setStage] = useState<"draft" | "dry" | "locked">("draft");
  return <div className="grid md:grid-cols-2 gap-4 mt-5">
    <Card><p className="pk-eyebrow">August 2026</p><h2 className="pk-h2">Month-end ledger run</h2>
      {stage === "draft" ? <button className="pk-btn mt-3" onClick={() => setStage("dry")}>Run dry-run</button> : <>
        <ul className="text-sm mt-2 space-y-1"><li>3 sites · 412 qualifying plays</li><li>Artist pool (70%): {money(104.97)}</li><li>Exceptions: 1 held share (Jo Tan, not on The Pack yet)</li></ul>
        {stage === "dry" ? <button className="pk-btn mt-3" onClick={() => { setStage("locked"); log(PEOPLE.admin, "Approved and posted August ledger"); }}>Approve and post</button> : <div className="mt-3"><Chip tone="green">Posted and locked</Chip></div>}</>}
      {state.testMode && <p className="text-sm mt-2">Ledger only — no money moves.</p>}</Card>
    <Card><h2 className="pk-h3">Reconciliation</h2><table className="pk-table mt-2"><tbody>
      <tr><td>Site pots collected</td><td>{money(149.97)}</td></tr><tr><td>Artist pool (70%)</td><td>{money(104.97)}</td></tr>
      <tr><td>Posted to artists</td><td>{money(98.67)}</td></tr><tr><td>Held / unclaimed</td><td>{money(6.30)}</td></tr>
      <tr><td className="font-bold">Difference</td><td className="font-bold">{money(0)}</td></tr></tbody></table></Card>
  </div>;
}

export function AdminPayments() {
  const { state } = usePack();
  return <AdminDesk>
    <PageTitle eyebrow="Payments" title="Payment processing">How money moves for each payment type. {state.testMode ? "Test mode is on — all processing is simulated." : ""}</PageTitle>
    <div className="grid md:grid-cols-2 gap-4">
      {FLOWS.map(f => <Card key={f.who}>
        <p className="pk-eyebrow">{f.who}</p><h2 className="pk-h2">{f.type}</h2>
        <p className="text-sm mt-1">{f.price}</p>
        <p className="text-sm font-bold mt-3">{f.stripe}</p>
        <ol className="list-decimal pl-5 mt-2 text-sm space-y-1">{f.steps.map(s => <li key={s}>{s}</li>)}</ol>
        <div className="mt-3"><Chip tone="amber">Pilot: {f.pilot}</Chip></div>
      </Card>)}
    </div>
    <MonthEnd />
    <Card className="mt-5"><h2 className="pk-h3">Shared pieces</h2>
      <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
        <li>One Stripe account for The Pack; artists paid through Connect.</li>
        <li>Webhooks feed a single ledger: every dollar in is tagged to a site or listener, every dollar out to an artist or the fund.</li>
        <li>Plays reported to artists come from the same ledger as the earnings statement.</li>
        <li>Test mode switches all four flows to the simulated ledger — no charges, no transfers.</li>
      </ul></Card>
  </AdminDesk>;
}

export function AdminAudit() {
  const { state } = usePack();
  return <AdminDesk>
    <PageTitle eyebrow="Audit log" title="Audit log">Every invite, decision, publish and settings change.</PageTitle>
    <Card className="overflow-x-auto"><table className="pk-table"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Old</th><th>New</th></tr></thead><tbody>
      {state.audit.map((a, i) => <tr key={i}><td className="whitespace-nowrap">{a.when}</td><td>{a.who}</td><td>{a.what}</td><td>{a.old ?? ""}</td><td>{a.new ?? ""}</td></tr>)}
    </tbody></table></Card>
  </AdminDesk>;
}
