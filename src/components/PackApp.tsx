import { Link } from "@tanstack/react-router";
import {
  ArrowLeft, ArrowRight, BadgeDollarSign, Building2, CalendarDays, Check, ChevronRight, CircleUserRound,
  Disc3, Download, Headphones, Heart, Home, Library, Map, MapPin, Music2, Pause, Play,
  Plus, Search, Settings, ShieldCheck, SkipForward, Sparkles, Upload, Users, WandSparkles,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import night from "@/assets/album-night.jpg";
import sun from "@/assets/album-sun.jpg";
import tide from "@/assets/album-tide.jpg";
import { PackLogo } from "@/components/pack/kit";
import stanleyBlack from "@/assets/pack-music-stanley-black.svg";
import cyanYellow from "@/assets/pack-cyan-yellow.jpg";
import bluePink from "@/assets/pack-blue-pink-stanley.jpg";
import pinkPeach from "@/assets/pack-pink-peach-stanley.jpg";
import blueGreen from "@/assets/pack-blue-green.jpg";
import orangeYellow from "@/assets/pack-orange-yellow.jpg";

export type Track = { title: string; artist: string; image: string; tag?: string };
export const tracks: Track[] = [
  { title: "Saltwater Static", artist: "Mika Wren", image: night, tag: "Heard at Mojos · 6 Sep" },
  { title: "West of the Sun", artist: "The Paper Moons", image: sun },
  { title: "Soft Current", artist: "Naarm Tides", image: tide },
];

export function Brand() {
  return <Link to="/" className="brand" aria-label="The Pack home"><PackLogo className="pack-logo-yellow" /></Link>;
}

export function BrandBackground(_props: { src: string }) {
  return null;
}

export function Shell({ children, active = "home", mini = true, style, role = "listener" }: { children: ReactNode; active?: string; mini?: boolean; style?: React.CSSProperties; role?: "listener" | "artist" | "business" }) {
  return <div className={`app-shell${role !== "listener" ? ` shell-${role}` : ""}`} style={style}>
    <header className="topbar"><Brand /><div className="top-actions"><Link to="/membership" className="member-pill"><Users size={15}/> Co-op member</Link><Link to="/sign-in" search={{role:"artist"}} className="avatar" aria-label="Artist workspace">MW</Link></div></header>
    <main>{children}</main>
    {mini && <MiniPlayer />}
    <nav className="tabbar" aria-label="Main navigation">
      <Link to="/home" className={active === "home" ? "active" : ""}><Home/><span>Home</span></Link>
      <Link to="/map" className={active === "discover" ? "active" : ""}><Search/><span>Discover</span></Link>
      <Link to="/library" className={active === "library" ? "active" : ""}><Library/><span>Library</span></Link>
      <Link to="/me" className={active === "profile" ? "active" : ""}><CircleUserRound/><span>Profile</span></Link>
    </nav>
  </div>;
}

function MiniPlayer() {
  const [playing, setPlaying] = useState(true);
  return <div className="mini-player"><img src={night} alt="Saltwater Static cover" width={52} height={52}/><Link to="/player" className="mini-copy"><strong>Saltwater Static</strong><span>Mika Wren</span></Link><button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause/> : <Play/>}</button></div>;
}

export function SectionTitle({ eyebrow, children, action }: { eyebrow: string; children: ReactNode; action?: ReactNode }) {
  return <div className="section-heading"><div><span>{eyebrow}</span><h2>{children}</h2></div>{action}</div>;
}

export function TrackRow({ track, saved, onSave }: { track: Track; saved?: boolean; onSave?: () => void }) {
  return <div className="track-row"><img src={track.image} alt={`${track.title} cover`} loading="lazy" width={64} height={64}/><div className="track-copy"><strong>{track.title}</strong><span>{track.artist}</span>{track.tag && <small><MapPin size={12}/>{track.tag}</small>}</div>{onSave ? <button className={saved ? "save active" : "save"} onClick={onSave} aria-label={`Save ${track.title}`}><Heart fill={saved ? "currentColor" : "none"}/></button> : <Link to="/player" className="round-button" aria-label={`Play ${track.title}`}><Play/></Link>}</div>;
}

export function HomeApp() {
  return <Shell><section className="hero home-hero"><BrandBackground src={bluePink}/><p className="eyebrow light">Good evening, Mia</p><h1>Local music.<br/>Louder together.</h1><p>Co-op owned, human picked, made close to home.</p><Button asChild variant="dark"><Link to="/saved">See what’s live <ArrowRight size={18}/></Link></Button></section>
    <section className="content"><SectionTitle eyebrow="Curated by The Pack" action={<Link to="/map">See all</Link>}>This week’s picks</SectionTitle><div className="album-grid">{tracks.map((t)=><article className="album" key={t.title}><img src={t.image} alt={`${t.title} cover`} loading="lazy" width={1024} height={1024}/><strong>{t.title}</strong><span>{t.artist}</span></article>)}</div>
    <SectionTitle eyebrow="Picked by local businesses">Out in Perth tonight</SectionTitle><Link to="/map" className="business-banner"><div><span className="live-dot">LIVE</span><h3>Mojos Bar</h3><p>Fremantle · Warm, eclectic, late</p></div><ChevronRight/></Link>
    <SectionTitle eyebrow="New from artists you follow">Fresh arrivals</SectionTitle><div className="list">{tracks.slice(1).map(t=><TrackRow track={t} key={t.title}/>)}</div></section></Shell>;
}

export function CheckInApp() {
  const [saved, setSaved] = useState(false);
  const [extra, setExtra] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const toggle=(t:string)=>setExtra(extra.includes(t)?extra.filter(x=>x!==t):[...extra,t]);
  const showGuest=(saved?1:0)+extra.length>=2&&!dismissed;
  return <Shell mini={false}><section className="now-playing"><BrandBackground src={bluePink}/><Link to="/home" className="back"><ArrowLeft/> Back</Link><div className="live-badge"><span/> Live at Mojos</div><p className="eyebrow light">Now playing at</p><h1>Mojos</h1><Link to="/player" className="art-button" aria-label="Open full player"><img src={night} alt="Saltwater Static by Mika Wren" width={1024} height={1024}/><span className="play-float"><Play fill="currentColor"/></span></Link><div className="now-copy"><div><h2>Saltwater Static</h2><Link to="/artist/$slug" params={{slug:"mika-wren"}}>Mika Wren <ArrowRight size={15}/></Link></div><button className={saved ? "save-big saved" : "save-big"} onClick={()=>setSaved(!saved)}><Heart fill={saved ? "currentColor" : "none"}/>{saved ? "Saved" : "Save"}</button></div>{saved && <div className="toast"><Check/> Saved with “Heard at Mojos · 6 Sep”</div>}<p className="business-link"><Link to="/business/$slug" params={{slug:"mojos"}}>About Mojos — vibe, hours, recent artists <ArrowRight size={15}/></Link></p></section><section className="content queue"><SectionTitle eyebrow="Mojos’ live queue">Up next</SectionTitle>{tracks.slice(1).map(t=><TrackRow track={t} key={t.title} saved={extra.includes(t.title)} onSave={()=>toggle(t.title)}/>)}
    {showGuest && <div className="guest-prompt"><img className="stanley-mark small" src={stanleyBlack} alt="Stanley, The Pack mascot"/><div><h3>Keep your saves?</h3><p>You’ve saved two tracks tonight. Make a free account and they’ll still be here tomorrow — with their “Heard at Mojos” tags.</p><div className="guest-actions"><Button asChild><Link to="/sign-up">Create an account</Link></Button><Button variant="ghost" onClick={()=>setDismissed(true)}>Not now</Button></div></div></div>}</section></Shell>;
}

export const gigs=[
  {when:"Tonight · 8pm",act:"Mika Wren (solo)",business:"Mojos Bar",slug:"mojos"},
  {when:"Fri 11 Sep · 9pm",act:"The Paper Moons",business:"The Bird",slug:"the-bird"},
  {when:"Sat 12 Sep · 7pm",act:"Naarm Tides",business:"Clancy’s Fish Pub",slug:"clancys"},
];

export function DiscoverApp() {
  const [filter,setFilter]=useState("All"); const [view,setView]=useState<"map"|"gigs">("map");
  return <Shell active="discover"><section className="page-head pink"><BrandBackground src={pinkPeach}/><p className="eyebrow light">Human curation only</p><h1>Find your next favourite.</h1></section><section className="content"><div className="searchbox"><Search/><input aria-label="Search artists, tracks and businesses" placeholder="Artists, tracks, businesses"/></div><div className="chips">{["All","Chill","Live band","Late night","Local artists"].map(x=><button key={x} onClick={()=>setFilter(x)} className={filter===x?"active":""}>{x}</button>)}</div><SectionTitle eyebrow="Where to go tonight" action={<div className="toggle-pair"><button className={view==="map"?"active":""} onClick={()=>setView("map")}>Map</button><button className={view==="gigs"?"active":""} onClick={()=>setView("gigs")}><CalendarDays size={14}/> Gig calendar</button></div>}>Around Fremantle</SectionTitle>
    {view==="map" ? <><div className="mock-map"><div className="map-road r1"/><div className="map-road r2"/><span className="water">Swan River</span><Link to="/business/$slug" params={{slug:"mojos"}} className="pin p1"><MapPin fill="currentColor"/><b>Mojos</b></Link><Link to="/business/$slug" params={{slug:"the-bird"}} className="pin p2" aria-label="The Bird"><MapPin fill="currentColor"/></Link><Link to="/business/$slug" params={{slug:"clancys"}} className="pin p3" aria-label="Clancy’s Fish Pub"><MapPin fill="currentColor"/></Link></div><div className="business-card"><div><span className="live-dot">LIVE MUSIC · 8PM</span><h3>Mojos Bar</h3><p>Warm, eclectic, late · North Fremantle</p></div><Button asChild><Link to="/business/$slug" params={{slug:"mojos"}}>View</Link></Button></div></> : <div className="list gig-list">{gigs.map(g=><Link key={g.act} to="/business/$slug" params={{slug:g.slug}} className="gig-row"><div><span className="live-dot">{g.when}</span><strong>{g.act}</strong><span>{g.business}</span></div><ChevronRight/></Link>)}</div>}
    <SectionTitle eyebrow="Picked by Mojos">For a late one</SectionTitle>{tracks.map(t=><TrackRow track={t} key={t.title}/>)}</section></Shell>;
}

export function LibraryApp() {
  const [tab,setTab]=useState("Saved tracks");
  const [playlists,setPlaylists]=useState<{name:string;tracks:Track[]}[]>([]);
  const [open,setOpen]=useState<string|null>(null);
  const [creating,setCreating]=useState(false); const [name,setName]=useState("");
  const [follows,setFollows]=useState<string[]>(["Mika Wren","Mojos Bar"]);
  const toggleFollow=(n:string)=>setFollows(follows.includes(n)?follows.filter(x=>x!==n):[...follows,n]);
  const current=playlists.find(p=>p.name===open);
  const create=()=>{const n=name.trim()||"Fremantle nights";setPlaylists([...playlists,{name:n,tracks}]);setName("");setCreating(false);setOpen(n);};
  return <Shell active="library"><section className="page-head cyan"><BrandBackground src={cyanYellow}/><p className="eyebrow">Your collection</p><h1>Library</h1></section><section className="content"><div className="tabs">{["Saved tracks","Playlists","Following"].map(x=><button className={tab===x?"active":""} onClick={()=>{setTab(x);setOpen(null);}} key={x}>{x}</button>)}</div>{tab==="Saved tracks" && <div className="list">{tracks.map(t=><TrackRow track={t} key={t.title}/>)}</div>}
    {tab==="Playlists" && (current ? <div><button className="back dark" onClick={()=>setOpen(null)}><ArrowLeft/> All playlists</button><SectionTitle eyebrow="Playlist">{current.name}</SectionTitle><div className="list">{current.tracks.map(t=><TrackRow track={t} key={t.title}/>)}</div></div>
      : playlists.length===0&&!creating ? <div className="empty"><img className="stanley-mark" src={stanleyBlack} alt="Stanley, The Pack mascot"/><h2>Your places, your soundtrack</h2><p>Group saved tracks into a playlist. Their “Heard at” memories stay attached.</p><Button onClick={()=>setCreating(true)}><Plus/> New playlist</Button></div>
      : <div><div className="list">{playlists.map(p=><button key={p.name} className="follow-row plain" onClick={()=>setOpen(p.name)}><div className="artist-orb"><Library/></div><div><strong>{p.name}</strong><span>{p.tracks.length} tracks · “Heard at” tags kept</span></div><ChevronRight/></button>)}</div>{creating ? <div className="create-playlist"><label htmlFor="pl-name">Playlist name</label><input id="pl-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Fremantle nights"/><Button onClick={create}><Check/> Create playlist</Button></div> : <Button className="mt-4" onClick={()=>setCreating(true)}><Plus/> New playlist</Button>}</div>)}
    {tab==="Following" && <div className="list"><div className="follow-row"><div className="artist-orb">MW</div><div><strong>Mika Wren</strong><span>Artist · Fremantle</span></div><Button variant={follows.includes("Mika Wren")?"secondary":"default"} onClick={()=>toggleFollow("Mika Wren")}>{follows.includes("Mika Wren")?"Following":"Follow"}</Button></div><div className="follow-row"><div className="artist-orb orange"><Building2/></div><div><strong>Mojos Bar</strong><span>Business · North Fremantle</span></div><Button variant={follows.includes("Mojos Bar")?"secondary":"default"} onClick={()=>toggleFollow("Mojos Bar")}>{follows.includes("Mojos Bar")?"Following":"Follow"}</Button></div></div>}</section></Shell>;
}

export function MembershipApp() {
  const [role,setRole]=useState("Listener"); const [accepted,setAccepted]=useState(false);
  const [patron,setPatron]=useState<string|null>(null);
  const roleMeta: Record<string,{price:string;copy:string;features:string[];icon:typeof Headphones;accent:string;grad:string;page:string}> = {
    Listener:{price:"$9.99 / month",copy:"Stream local music and direct 70% of your subscription to the artists you play.",features:["Unlimited listening","Save your live-music memories","Associate membership (no voting rights)"],icon:Headphones,accent:"var(--pack-blue)",grad:"linear-gradient(160deg,oklch(0.50 0.30 266),oklch(0.55 0.30 305) 55%,oklch(0.62 0.29 340))",page:"linear-gradient(180deg,oklch(0.46 0.30 266),oklch(0.54 0.30 300) 45%,oklch(0.64 0.29 342))"},
    Artist:{price:"Free to join",copy:"Upload and manage your catalogue at no cost. Add an optional Band Page for $10 / month to showcase your act.",features:["Free uploads via MetaGen workflow","Optional Band Page · $10 / month","$10 payout threshold (simulated in the pilot)","Own and export your data"],icon:Disc3,accent:"var(--pack-pink)",grad:"linear-gradient(160deg,oklch(0.60 0.28 350),oklch(0.66 0.21 20) 55%,oklch(0.72 0.16 62))",page:"linear-gradient(180deg,oklch(0.56 0.29 348),oklch(0.65 0.21 18) 50%,oklch(0.74 0.16 68))"},
    Business:{price:"$49.99 / site / month",copy:"A business music subscription for bars, shops, cafés and more. Pilot price per site; pricing will be tiered by annual turnover after the pilot.",features:["Never per-play","Curated playlists for your business type","Multi-site options"],icon:Building2,accent:"var(--pack-orange)",grad:"linear-gradient(160deg,oklch(0.63 0.20 45),oklch(0.69 0.17 70) 55%,oklch(0.76 0.16 92))",page:"linear-gradient(180deg,oklch(0.60 0.21 40),oklch(0.69 0.17 68) 50%,oklch(0.78 0.16 95))"},
    Government:{price:"Tiered patronage",copy:"Local and State governments can open public spaces to local music. LGAs are tiered by population size; State government spaces are priced per space and capacity.",features:["Support local music in public spaces","Population-based tiers for LGAs","Per-space pricing for State sites"],icon:ShieldCheck,accent:"var(--pack-green)",grad:"linear-gradient(160deg,oklch(0.60 0.14 200),oklch(0.63 0.17 165) 55%,oklch(0.68 0.19 145))",page:"linear-gradient(180deg,oklch(0.58 0.14 205),oklch(0.63 0.17 168) 50%,oklch(0.70 0.19 145))"},
  };
  const m=roleMeta[role] ?? roleMeta["Listener"]; if(!m) return null; const patronOptions=["$2","$5","$10","$15"];
  return <Shell mini={false} style={{background:m.page}}><section className="page-head blue"><BrandBackground src={bluePink}/><Link to="/" className="back"><ArrowLeft/> Home</Link><p className="eyebrow light">Join the co-operative</p><h1>Choose your place in The Pack.</h1></section><section className="content narrow"><div className="member-tabs">{Object.keys(roleMeta).map(x=>{const Ri=roleMeta[x]!.icon;return <button key={x} className={role===x?"active":""} onClick={()=>{setRole(x);setPatron(null);}}><span className="tab-icon" style={{background:roleMeta[x]!.accent}}><Ri/></span><span>{x}</span></button>;})}</div><article className="tier" style={{background:m.grad}}><span className="eyebrow">{role} membership{role==="Listener"?" · Phase 3 preview":""}</span><h2>{m.price}</h2><p>{m.copy}</p><ul>{m.features.map(x=><li key={x}><Check/>{x}</li>)}</ul></article>{role==="Listener"&&<article className="tier patron"><span className="eyebrow">Optional patron add-on</span><h2>Back your local artists</h2><p>Top up your membership and your extra contribution goes into a music industry development fund supporting local artists.</p><div className="patron-options">{patronOptions.map(x=><button key={x} className={patron===x?"active":""} onClick={()=>setPatron(x)}>+{x}<small>/mo</small></button>)}</div>{patron&&<p className="fineprint">Patron total: {patron} extra per month into the development fund.</p>}</article>}<div className="rules"><ShieldCheck/><div><h3>Co-op Rules</h3><p>Membership means sharing our artist-first values and accepting the rules that govern the co-operative.</p><label><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I’ve read and accept the Co-op Rules (version 1.0) as {role==="Artist"?"a Full":"an Associate"} member</span></label><p className="fineprint"><a href="#rules" className="underline">Read the Co-op Rules</a> · Artists are Full members; listeners, businesses and government are Associate members.</p>{role!=="Artist"&&<label className="opt-in"><input type="checkbox"/><span>Optional: include my data in area (SA2) totals for the Open data project. Never names anyone; you can withdraw later. Saying no never affects your membership.</span></label>}</div></div><Button disabled={!accepted} className="wide">Continue as {role}<ArrowRight/></Button><p className="fineprint">Membership enrolment is separate from payment setup and music licensing.</p></section></Shell>;
}

export const catalogue=[
  {title:"Saltwater Static",status:"Live",note:"Metadata complete · licence signed"},
  {title:"Harbour Lights",status:"Pending review",note:"MetaGen metadata returned · awaiting Pack review"},
  {title:"Slow Ferry",status:"Pending review",note:"Licence-back signature outstanding"},
];

export function ArtistApp() {
  const [stage,setStage]=useState(0); const steps=["Upload","MetaGen","Licence","Splits","Ready"];
  return <Shell mini={false}><section className="workspace-head"><div><span className="eyebrow">Artist workspace</span><h1>Mika Wren</h1></div><Button variant="secondary"><Download/> Export my data</Button></section><section className="content wide-content"><div className="stats"><div><span>Plays this month</span><strong>8,492</strong><small>↑ 18% from August</small></div><div><span>Available earnings</span><strong>$184.20</strong><small>Paid monthly over $5</small></div><div><span>Tracks live</span><strong>12</strong><small>2 awaiting review</small></div></div>
    <div className="quick-links"><Link to="/artist-portal/join"><CircleUserRound/><div><strong>Artist details</strong><span>Legal name, stage name, home region</span></div><ChevronRight/></Link><Link to="/artist-portal/statement"><BadgeDollarSign/><div><strong>Payout setup</strong><span>Connect your bank · $5 threshold</span></div><ChevronRight/></Link></div>
    <SectionTitle eyebrow="Catalogue">Bring a track into The Pack</SectionTitle><div className="stepper">{steps.map((x,i)=><button key={x} className={i<=stage?"done":""} onClick={()=>setStage(i)}><span>{i<stage?<Check/>:i+1}</span>{x}</button>)}</div><ArtistStep stage={stage} next={()=>setStage(Math.min(4,stage+1))}/>
    <SectionTitle eyebrow="Track status">Pending review or live</SectionTitle><div className="list">{catalogue.map(c=><div className="status-row" key={c.title}><div><strong>{c.title}</strong><span>{c.note}</span></div><span className={c.status==="Live"?"pill live":"pill pending"}>{c.status}</span></div>)}</div>
    <SectionTitle eyebrow="How your royalty works">No pool. No algorithm.</SectionTitle><div className="explainer"><BadgeDollarSign/><p>Every listen puts a share of that listener’s subscription toward you. The Pack pays artists directly, with 70% flowing to the artists each member actually plays.</p></div></section></Shell>;
}

function ArtistStep({stage,next}:{stage:number;next:()=>void}) {
  const [tags,setTags]=useState({genre:"Dream pop",bpm:"96",mood:"Late night, warm"});
  const [confirmed,setConfirmed]=useState(false);
  if(stage===0) return <div className="process-card"><div className="drop"><Upload/><h3>Drop your audio file here</h3><p>WAV or FLAC · basic release details follow</p></div><Button onClick={next}>Use sample track <ArrowRight/></Button></div>;
  if(stage===1) return <div className="process-card"><div className="partner"><WandSparkles/><div><span>METADATA BY</span><h3>MetaGen Music</h3></div></div><p>MetaGen captures and validates writers, performers, identifiers, credits, copyright holders, release details and genre. You’ll review everything before it returns to The Pack.</p><div className="status-list"><span><Check/> Audio transferred</span><span className="working"><Sparkles/> Suggested tags ready for your review</span><span>○ Catalogue mapping to The Pack</span><span>○ Loudness normalisation · partner TBC</span></div>
    <div className="tag-fields"><label>Genre<input value={tags.genre} onChange={e=>{setTags({...tags,genre:e.target.value});setConfirmed(false);}}/></label><label>BPM<input value={tags.bpm} onChange={e=>{setTags({...tags,bpm:e.target.value});setConfirmed(false);}}/></label><label>Mood<input value={tags.mood} onChange={e=>{setTags({...tags,mood:e.target.value});setConfirmed(false);}}/></label></div><p className="fineprint left">Suggested by MetaGen — edit anything that isn’t right, then confirm. Nothing is published until you do.</p>
    {confirmed&&<div className="notice"><Check size={16}/> Tags confirmed by you.</div>}<div className="guest-actions"><Button variant="secondary" onClick={()=>setConfirmed(true)}><Check/> Confirm tags</Button><Button onClick={next} disabled={!confirmed}>Continue <ArrowRight/></Button></div></div>;
  if(stage===2) return <div className="process-card"><h3>Track licence-back</h3><p>You grant The Pack permission to stream this track under your own APRA AMCOS membership. The Pack pays you directly rather than through APRA AMCOS centrally.</p><div className="notice">APRA AMCOS applies to musicians. Business OneMusic obligations are handled separately.</div><Button onClick={next}><Check/> Sign and continue</Button></div>;
  if(stage===3) return <SplitStep next={next}/>;
  return <div className="process-card success"><img className="stanley-mark" src={stanleyBlack} alt="Stanley, The Pack mascot"/><h3>Saltwater Static is ready for Pack review</h3><p>MetaGen metadata complete · licence signed · splits confirmed · mastering partner to be confirmed.</p><Button onClick={()=>{}}>View catalogue status</Button></div>;
}

function SplitStep({next}:{next:()=>void}) {
  return <div className="process-card"><h3>Who gets paid?</h3><div className="split"><span>Mika Wren (writer, performer)</span><strong>70%</strong></div><div className="split"><span>Jon Bell (co-writer)</span><strong>30%</strong></div><div className="split-total"><span>Total</span><strong><Check/> 100%</strong></div><p className="fineprint left">Splits come from the contributor details captured in MetaGen — nothing to enter here.</p><Button onClick={next}>Looks right <ArrowRight/></Button></div>;
}


export function BusinessApp() {
  const [onAir,setOnAir]=useState(true); const [reason,setReason]=useState(false);
  return <Shell mini={false}><section className="business-control"><BrandBackground src={blueGreen}/><div className="business-top"><Brand/><span className={onAir?"on-air":"off-air"}><i/>{onAir?"ON AIR":"PAUSED"}</span></div><div className="control-grid"><img src={tide} alt="Soft Current cover" width={1024} height={1024}/><div><p className="eyebrow light">Playing at Mojos</p><h1>Soft Current</h1><h2>Naarm Tides</h2><div className="wave"><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="control-buttons"><button onClick={()=>setOnAir(!onAir)} aria-label={onAir?"Pause":"Play"}>{onAir?<Pause/>:<Play/>}</button><Button variant="dark" onClick={()=>setReason(true)}>Skip <SkipForward/></Button></div></div></div>{reason&&<div className="reason"><h3>Why skip this track?</h3><button onClick={()=>setReason(false)}>Doesn’t fit tonight</button><button onClick={()=>setReason(false)}>Wrong energy</button><button onClick={()=>setReason(false)}>Other</button></div>}</section><section className="content"><div className="quick-links"><Link to="/biz/site"><Building2/><div><strong>Your business page</strong><span>Photos, vibe description, opening hours</span></div><ChevronRight/></Link><Link to="/business/$slug" params={{slug:"mojos"}}><MapPin/><div><strong>Preview public page</strong><span>See what listeners see</span></div><ChevronRight/></Link></div><SectionTitle eyebrow="Business music subscription">OneMusic stays clear</SectionTitle><div className="licensing"><ShieldCheck/><div><h3>Keep your current OneMusic licence for now.</h3><p>The Pack is confirming what its model means for existing business obligations. We’ll tell members the moment that changes. Your Pack business music subscription is $49.99 per site per month during the pilot — never priced by the number of plays.</p><Button asChild><Link to="/membership">View business pricing</Link></Button></div></div></section></Shell>;
}

export function ProfileApp() {
 return <Shell active="profile"><section className="page-head orange"><BrandBackground src={orangeYellow}/><p className="eyebrow">Member profile</p><h1>Mia Collins</h1><p>Listener member · Fremantle</p></section><section className="content"><div className="profile-list"><Link to="/membership"><Users/><div><strong>Membership & subscription</strong><span>Listener · Active</span></div><ChevronRight/></Link><Link to="/money"><BadgeDollarSign/><div><strong>Where your money goes</strong><span>The 70/30 split, in plain English</span></div><ChevronRight/></Link><Link to="/sign-in" search={{role:"listener"}}><ShieldCheck/><div><strong>Sign in &amp; security</strong><span>Email, password or magic link</span></div><ChevronRight/></Link><button><Settings/><div><strong>Preferences</strong><span>Playback, notifications, privacy</span></div><ChevronRight/></button></div><SectionTitle eyebrow="Trust & transparency">How we work</SectionTitle><div className="transparency"><h3>Ethical infrastructure, honestly explained.</h3><p>We self-host where practical. We use large-scale delivery services only where needed to keep music moving smoothly across Australia — paying fees, never giving away ownership.</p><button>See what data we hold about you <ArrowRight/></button></div><Button asChild variant="secondary"><Link to="/artist-portal"><Music2/> Switch to artist workspace</Link></Button><Button asChild variant="secondary" className="ml-2"><Link to="/biz"><Building2/> Business player</Link></Button></section></Shell>;
}
