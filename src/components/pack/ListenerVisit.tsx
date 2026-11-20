import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, MessageSquarePlus, X } from "lucide-react";
import { Art, Card, Chip, Empty, Hero, OnAir, Phone } from "./kit";
import { SignInSheet } from "./SignInSheet";
import { artistBySlug, artistOf, artists, businessBySlug, businesses, heardTag, recentPlays, song, songs, usePack, type Business } from "@/lib/pack-store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/* A1 + A2: What's playing here */
function BackButton() {
  const navigate = useNavigate();
  return <button type="button" className="inline-flex items-center gap-1 text-sm font-bold" onClick={() => { if (window.history.length > 1) window.history.back(); else void navigate({ to: "/home" }); }}><ArrowLeft size={16} /> Back</button>;
}

export function WhatsPlaying({ biz }: { biz: Business }) {
  const { state, set, saveSong, isSaved } = usePack();
  const [sheet, setSheet] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const s = biz.nowPlaying ? song(biz.nowPlaying) : null;
  const saved = s ? isSaved(s.id) : undefined;
  const onSave = () => { if (!s) return; if (!state.user) return setSheet(true); saveSong(s.id, biz.slug); };

  return <Phone>
    <Hero>
      <p className="pk-eyebrow opacity-90">Now playing at</p>
      <Link to="/business/$slug" params={{ slug: biz.slug }} className="pk-h1 underline decoration-2 underline-offset-4">{biz.name}</Link>
    </Hero>
    <div className="p-5">
      {s ? <>
        <Art seed={s.art} className="w-full aspect-square border-2 border-pk-black" />
        <h2 className="pk-h1 mt-5">{s.title}</h2>
        <Link to="/artist/$slug" params={{ slug: s.artist }} className="text-lg font-bold underline underline-offset-4">{artistOf(s).name}</Link>
        <p className="mt-2"><Chip>Curated by Alex &amp; The Pack</Chip></p>
        {saved ? <div className="pk-btn pk-btn-big mt-6 bg-pk-green text-pk-black"><Check /> Saved · {heardTag(saved)}</div>
          : <button className="pk-btn pk-btn-big pk-btn-pink mt-6" onClick={onSave}>Save this song</button>}
        {prompt && <Card className="mt-5 relative">
          <button className="absolute right-3 top-3" aria-label="Dismiss" onClick={() => setPrompt(false)}><X size={18} /></button>
          <p className="font-bold pr-6">Your saves are safe. Want an account so they stay with you?</p>
          <Link to="/me" className="pk-btn pk-btn-ghost mt-3">Set up my account</Link>
        </Card>}
      </> : <>
        <h2 className="pk-h1">Nothing playing right now</h2>
        <p className="text-muted-foreground mt-1">Here's what played most recently.</p>
        <div className="mt-4 space-y-3">{(recentPlays[biz.slug] ?? []).map(id => { const r = song(id); return <div key={id} className="flex gap-3 items-center"><Art seed={r.art} className="w-14 h-14" /><div><p className="font-bold">{r.title}</p><Link to="/artist/$slug" params={{ slug: r.artist }} className="text-sm underline">{artistOf(r).name}</Link></div></div>; })}</div>
      </>}
    </div>
    <SignInSheet open={sheet} onOpenChange={setSheet} title="Save this song" lead="Sign in with an email link or a password. That's all we ask for."
      onSignedIn={() => { if (s) saveSong(s.id, biz.slug); set(x => ({ ...x, guestSaved: true })); setPrompt(true); }} />
  </Phone>;
}

/* A3: Artist page */
export function ArtistPage({ slug }: { slug: string }) {
  const a = artistBySlug(slug)!;
  const list = songs.filter(s => s.artist === slug);
  return <Phone>
    <Hero grad="grad-pp">
      <BackButton />
      <h1 className="pk-h1 mt-4">{a.name}</h1>
      <Chip tone="dark" className="mt-2">{a.region}</Chip>
    </Hero>
    <div className="p-5 space-y-5">
      <p className="text-lg font-semibold">{a.bio}</p>
      <Card><h3 className="pk-h3">Their story</h3><p className="mt-1">{a.story}</p></Card>
      <div><h3 className="pk-h3 mb-2">Songs</h3>
        <ul className="divide-y border-y">{list.map(s => <li key={s.id} className="flex justify-between py-3"><span className="font-semibold">{s.title}</span><span className="text-muted-foreground">{s.length}</span></li>)}</ul>
      </div>
    </div>
  </Phone>;
}

/* A4: Business page */
export function BusinessPage({ slug }: { slug: string }) {
  const { state, set } = usePack();
  const b = businessBySlug(slug)!;
  const [signIn, setSignIn] = useState(false);
  const [suggest, setSuggest] = useState(false);
  const [q, setQ] = useState(""); const [pick, setPick] = useState<string | null>(null); const [note, setNote] = useState(""); const [sent, setSent] = useState(false);
  const s = b.nowPlaying ? song(b.nowPlaying) : null;
  const open = () => state.user ? setSuggest(true) : setSignIn(true);
  const send = () => { if (!pick) return; set(x => ({ ...x, suggestions: [...x.suggestions, { id: crypto.randomUUID(), songId: pick, business: b.slug, note, source: "Listener" }] })); setSent(true); };
  const matches = songs.filter(x => (x.title + artistOf(x).name).toLowerCase().includes(q.toLowerCase()));

  return <Phone>
    <Art seed={b.art} className="w-full h-44 rounded-none" />
    <div className="p-5 space-y-5">
      <div><h1 className="pk-h1">{b.name}</h1><p className="font-semibold">{b.type} · {b.suburb}</p></div>
      <p>{b.vibe}</p>
      <Card><h3 className="pk-h3">Opening hours</h3><p className="mt-1">{b.hours}</p></Card>
      <Card className="flex gap-3 items-center">
        {s ? <><Art seed={s.art} className="w-16 h-16" /><div className="flex-1"><div className="flex justify-between items-center"><p className="pk-eyebrow">Playing now</p>{b.onAir && <OnAir small />}</div><p className="font-bold">{s.title}</p><Link to="/artist/$slug" params={{ slug: s.artist }} className="text-sm underline">{artistOf(s).name}</Link></div></>
          : <p className="font-semibold">Nothing playing right now.</p>}
      </Card>
      <div><h3 className="pk-h3 mb-2">Recent artists</h3>
        <ul className="space-y-2">{b.recent.map(r => { const a = artists.find(x => x.slug === r)!; return <li key={r} className="flex justify-between"><Link to="/artist/$slug" params={{ slug: r }} className="font-semibold underline">{a.name}</Link><span className="text-muted-foreground">{a.region}</span></li>; })}</ul>
      </div>
      <button onClick={open} className="w-full pk-card flex items-center gap-3 text-left"><MessageSquarePlus className="text-pk-blue" /><span className="font-bold flex-1">Suggest a song for this space</span></button>
      <div className="flex gap-2 flex-wrap">{businesses.filter(x => x.slug !== slug).map(x => <Link key={x.slug} to="/business/$slug" params={{ slug: x.slug }} className="pk-chip pk-chip-soft">{x.name}</Link>)}</div>
    </div>
    <SignInSheet open={signIn} onOpenChange={setSignIn} title="Sign in to suggest a song" lead="Sign in with an email link or a password. That's all we ask for." onSignedIn={() => setSuggest(true)} />
    <Sheet open={suggest} onOpenChange={o => { setSuggest(o); if (!o) { setSent(false); setPick(null); setQ(""); setNote(""); } }}>
      <SheetContent side="bottom" className="pk rounded-t-3xl max-w-md mx-auto border-2 border-pk-black">
        <SheetHeader className="text-left p-0 mb-3"><SheetTitle className="pk-h2">{sent ? "Suggestion sent" : `Suggest a song for ${b.name}`}</SheetTitle></SheetHeader>
        {sent ? <p>Thanks. {b.name}'s staff and their Pack curator will see it. A person decides, and it never plays automatically.</p> : <>
          <label className="pk-label">Find the song<input className="pk-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Song or artist" /></label>
          <div className="max-h-40 overflow-auto space-y-1 mb-3">{matches.map(m => <button key={m.id} onClick={() => setPick(m.id)} className={`w-full text-left px-3 py-2 rounded-lg border-2 ${pick === m.id ? "border-pk-blue bg-pk-cream" : "border-transparent"}`}><b>{m.title}</b> · {artistOf(m).name}</button>)}</div>
          <label className="pk-label">Why it fits (optional)<textarea className="pk-input" rows={2} value={note} onChange={e => setNote(e.target.value)} /></label>
          <button className="pk-btn w-full" disabled={!pick} onClick={send}>Send suggestion</button>
        </>}
      </SheetContent>
    </Sheet>
  </Phone>;
}

/* A5: Saved */
export function SavedPage() {
  const { state, set } = usePack();
  return <Phone>
    <Hero><p className="pk-eyebrow">Your saves</p><h1 className="pk-h1">Heard somewhere real</h1></Hero>
    <div className="p-5">
      {state.saves.length === 0 ? <Empty title="Nothing saved yet">Next time a song catches you in a café, tap Save.</Empty> :
        <ul className="space-y-3">{state.saves.map(sv => { const s = song(sv.songId); return <li key={sv.songId} className="pk-card flex gap-3 items-center">
          <Art seed={s.art} className="w-14 h-14" />
          <div className="flex-1 min-w-0"><p className="font-bold">{s.title}</p><Link to="/artist/$slug" params={{ slug: s.artist }} className="text-sm underline">{artistOf(s).name}</Link>{heardTag(sv) && <Chip className="mt-1">{sv.business ? `${businessBySlug(sv.business)?.name} · ${sv.date}` : ""}</Chip>}</div>
          <button aria-label={`Remove ${s.title}`} onClick={() => set(x => ({ ...x, saves: x.saves.filter(y => y.songId !== sv.songId) }))} className="p-2"><X /></button>
        </li>; })}</ul>}
    </div>
  </Phone>;
}
