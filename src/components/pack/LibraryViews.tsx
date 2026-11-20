import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Bookmark, ChevronDown, ChevronUp, Compass, ListMusic, Play, Plus, Store, Trash2, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { artists, businessBySlug, heardTag, song, songs, artistOf, usePack } from "@/lib/pack-store";
import { cn } from "@/lib/utils";
import { Art, Chip, Hero, Phone } from "./kit";

const CURATED = [
  { id: "fremantle", name: "Slow songs from Fremantle", by: "Alex & The Pack", songIds: ["tide-tables", "long-way-down", "kestrel-road"] },
  { id: "corner", name: "Corner Books picks", by: "Corner Books", songIds: ["paper-boats", "night-bus"] },
  { id: "river", name: "Fresh from Margaret River", by: "Sam", songIds: ["slow-water"] },
];
const TABS = [
  { id: "pinched", label: "Playlists I've pinched", icon: Bookmark },
  { id: "created", label: "Playlists I've created", icon: ListMusic },
  { id: "following", label: "Cool stuff I follow", icon: User },
] as const;

function LibraryEmpty({ icon: Icon, title, children, action }: { icon: typeof Bookmark; title: string; children: ReactNode; action: ReactNode }) {
  return <div className="py-12 flex flex-col items-center text-center text-pk-white gap-3">
    <Icon size={36} aria-hidden="true" /><h2 className="pk-h2">{title}</h2>
    <p className="text-sm max-w-sm">{children}</p><div className="mt-2">{action}</div>
  </div>;
}

export function LibraryPage() {
  const { state, set, isSaved } = usePack();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("pinched");
  const [pinched, setPinched] = useState(["fremantle", "corner"]);
  const [browsing, setBrowsing] = useState(false);
  const [name, setName] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const current = TABS.find(t => t.id === tab);
  const play = (ids: string[]) => set(s => ({ ...s, queue: ids }));
  const toggleOpen = (id: string) => {
    setOpen(value => value === id ? null : id);
  };

  function trackList(ids: string[], playlistId?: string) {
    return <ul className="mt-4 border-t border-pk-white/30 pt-3 space-y-2">
      {ids.map(id => { const track = songs.find(s => s.id === id); if (!track) return null; return <li key={id} className="flex items-center gap-3">
        <Art seed={track.art} className="w-10 h-10 rounded-md" />
        <div className="flex-1 min-w-0"><Link to="/player" search={{ song: id }} className="block font-semibold text-sm break-words">{track.title}</Link><Link to="/artist/$slug" params={{ slug: track.artist }} className="block text-xs underline">{artistOf(track).name}</Link>{(() => { const sv = isSaved(id); return sv && heardTag(sv) && sv.business ? <Chip className="mt-1">Heard at {businessBySlug(sv.business)?.name}</Chip> : null; })()}</div>
        {playlistId && <Button variant="ghost" size="icon" title="Remove song" aria-label={`Remove ${track.title}`} onClick={() => set(s => ({ ...s, playlists: s.playlists.map(p => p.id === playlistId ? { ...p, songIds: p.songIds.filter(x => x !== id) } : p) }))}><X /></Button>}
      </li>; })}
      {!ids.length && <li className="text-sm py-2">No songs yet. <Link to="/home" className="underline font-semibold">Discover music</Link></li>}
    </ul>;
  }

  function playlistCard(p: { id: string; name: string; songIds: string[] }, by: string, remove: () => void, owned = false) {
    const first = songs.find(s => s.id === p.songIds[0]);
    return <li key={p.id} className="rounded-lg bg-pk-black text-pk-white p-4 min-w-0">
      <div className="flex items-start gap-4">
        {first ? <Art seed={first.art} className="w-20 h-20 rounded-md" /> : <div className="w-20 h-20 shrink-0 bg-pk-white/10 rounded-md grid place-items-center"><ListMusic size={30} /></div>}
        <div className="min-w-0 flex-1"><p className="text-xs mb-1">{by}</p><h3 className="font-bold text-lg break-words">{p.name}</h3><p className="text-sm mt-1">{p.songIds.length} {p.songIds.length === 1 ? "song" : "songs"}</p></div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        {first && <Button asChild variant="ghost" className="pk-chip pk-chip-soft"><Link to="/player" search={{ song: first.id }} onClick={() => play(p.songIds)}><Play /> Play</Link></Button>}
        <Button variant="ghost" className="text-pk-white" aria-expanded={open === p.id} onClick={() => toggleOpen(p.id)}>{open === p.id ? <ChevronUp /> : <ChevronDown />} Songs</Button>
        <Button variant="ghost" size="icon" className="ml-auto text-pk-white" title={owned ? "Delete playlist" : "Remove pinched playlist"} aria-label={`${owned ? "Delete" : "Remove"} ${p.name}`} onClick={remove}><Trash2 /></Button>
      </div>
      {open === p.id && trackList(p.songIds, owned ? p.id : undefined)}
    </li>;
  }

  return <Phone>
    <Hero grad="grad-bg"><h1 className="pk-h1">Library</h1><p className="text-sm mt-1">Only you can see your library.</p></Hero>
    <div className="p-5">
      <div role="tablist" aria-label="Library views" className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => <Button key={id} variant="ghost" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`} className={cn("pk-chip h-auto min-h-11 whitespace-normal text-sm py-3", tab === id ? "pk-chip-dark" : "pk-chip-soft")} onClick={() => { setTab(id); setOpen(null); }}><Icon />{label}</Button>)}
      </div>
      <section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        <h2 className="pk-h2 text-pk-white mb-4">{current?.label}</h2>
        {tab === "pinched" && <>
          {pinched.length ? <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{CURATED.filter(p => pinched.includes(p.id)).map(p => playlistCard(p, `Curated by ${p.by}`, () => setPinched(ids => ids.filter(id => id !== p.id))))}</ul> :
            <LibraryEmpty icon={Bookmark} title="Nothing pinched yet" action={<Button className="pk-chip pk-chip-soft" onClick={() => setBrowsing(true)}><Compass /> Browse curated playlists</Button>}>A good playlist is worth keeping.</LibraryEmpty>}
          {!!pinched.length && <Button variant="ghost" className="pk-chip pk-chip-soft mt-5" onClick={() => setBrowsing(!browsing)}><Plus />{browsing ? "Close playlists" : "Browse curated playlists"}</Button>}
          {browsing && <div className="mt-6"><h3 className="pk-h3 text-pk-white mb-3">Curated by our community</h3><ul className="space-y-3">{CURATED.map(p => <li key={p.id} className="bg-pk-black text-pk-white rounded-lg p-4 flex items-center gap-3">
            <Art seed={song(p.songIds[0]).art} className="w-12 h-12 rounded-md" /><div className="min-w-0 flex-1"><p className="font-bold break-words">{p.name}</p><p className="text-xs">Curated by {p.by}</p></div>
            <Button variant="ghost" size="icon" title={pinched.includes(p.id) ? "Already pinched" : "Pinch playlist"} aria-label={`Pinch ${p.name}`} disabled={pinched.includes(p.id)} onClick={() => { setPinched(ids => [...ids, p.id]); }}><Bookmark /></Button>
          </li>)}</ul></div>}
        </>}
        {tab === "created" && <>
          <form className="flex flex-col sm:flex-row gap-3 mb-5" onSubmit={e => { e.preventDefault(); if (!name.trim()) return; const id = crypto.randomUUID(); set(s => ({ ...s, playlists: [...s.playlists, { id, name: name.trim(), songIds: [] }] })); setName(""); setOpen(id); }}>
            <input className="pk-input min-w-0 text-pk-black" aria-label="Playlist name" value={name} onChange={e => setName(e.target.value)} placeholder="Playlist name" />
            <Button type="submit" className="pk-chip pk-chip-dark h-auto min-h-11" disabled={!name.trim()}><Plus /> New playlist</Button>
          </form>
          {state.playlists.length ? <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{state.playlists.map(p => playlistCard(p, "Created by you", () => set(s => ({ ...s, playlists: s.playlists.filter(x => x.id !== p.id) })), true))}</ul> :
            <LibraryEmpty icon={ListMusic} title="Your first playlist awaits" action={<Button variant="ghost" className="pk-chip pk-chip-soft" onClick={() => document.querySelector<HTMLInputElement>('input[aria-label="Playlist name"]')?.focus()}><Plus /> Create a playlist</Button>}>Your songs. Your order. Your kind of music.</LibraryEmpty>}
        </>}
        {tab === "following" && <>
          {state.follows.length ? <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{state.follows.map(f => {
            const artist = f.kind === "artist" ? artists.find(a => a.slug === f.id) : undefined;
            const business = f.kind === "business" ? businessBySlug(f.id) : undefined;
            if (!artist && !business) return null;
            const title = artist?.name ?? business?.name;
            const track = artist ? songs.find(s => s.artist === artist.slug) : songs.find(s => s.id === business?.nowPlaying);
            return <li key={f.kind + f.id} className="bg-pk-black text-pk-white rounded-lg p-4 min-w-0">
              <div className="flex gap-3 items-center">{track ? <Art seed={track.art} className="w-16 h-16 rounded-md" /> : <Store size={36} />}
                <div className="min-w-0"><p className="text-xs">{artist ? "Musician" : business?.type}</p><h3 className="font-bold text-lg break-words">{artist ? <Link to="/artist/$slug" params={{ slug: artist.slug }} className="underline">{title}</Link> : <Link to="/business/$slug" params={{ slug: f.id }} className="underline">{title}</Link>}</h3><p className="text-xs mt-1">{artist?.region ?? business?.suburb}</p></div>
              </div>
              <p className="text-sm mt-3">{artist ? `${songs.filter(s => s.artist === artist.slug).length} songs` : business?.onAir && track ? `Now playing: ${track.title}` : "Not playing right now"}</p>
              <div className="flex justify-between items-center mt-3 gap-2">
                <Button asChild variant="ghost" className="pk-chip pk-chip-soft">{artist ? <Link to="/artist/$slug" params={{ slug: artist.slug }}><User /> Artist page</Link> : <Link to="/business/$slug" params={{ slug: f.id }}><Store /> Business page</Link>}</Button>
                <Button variant="ghost" size="icon" title="Unfollow" aria-label={`Unfollow ${title}`} onClick={() => set(s => ({ ...s, follows: s.follows.filter(x => !(x.id === f.id && x.kind === f.kind)) }))}><X /></Button>
              </div>
              <label className="flex items-center gap-2 text-xs mt-4"><input type="checkbox" checked={f.public} onChange={e => set(s => ({ ...s, follows: s.follows.map(x => x.id === f.id && x.kind === f.kind ? { ...x, public: e.target.checked } : x) }))} /> Follow publicly</label>
            </li>;
          })}</ul> : <LibraryEmpty icon={User} title="No favourites to follow yet" action={<Button asChild className="pk-chip pk-chip-soft"><Link to="/home"><Compass /> Discover music</Link></Button>}>Keep your favourite musicians and Pack places close.</LibraryEmpty>}
          <p className="text-xs text-pk-white mt-5">Follows are private unless you choose to follow publicly. Public follows show your display name to that artist or business.</p>
        </>}
      </section>
    </div>
  </Phone>;
}