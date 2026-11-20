import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Bookmark, Store, User, Home, Library, Map as MapIcon } from "lucide-react";
import { SHOW_METAGEN_NOTES } from "@/lib/metagen-receive";
import { usePack } from "@/lib/pack-store";
import { cn } from "@/lib/utils";
import logoStanley from "@/assets/pack-music-stanley-black.svg";
/** Supplied Stanley + wordmark logo, filled with the current text colour (same technique as packmusic.au). */
export function PackLogo({ className }: { className?: string }) {
  return <span role="img" aria-label="Pack Music" className={cn("pack-logo", className)} style={{ WebkitMaskImage: `url("${logoStanley}")`, maskImage: `url("${logoStanley}")` }} />;
}

import albumTide from "@/assets/album-tide.jpg";
import albumSun from "@/assets/album-sun.jpg";
import albumNight from "@/assets/album-night.jpg";

const COVERS = [albumTide, albumSun, albumNight];

export function Art({ seed, className }: { seed: number; className?: string }) {
  return <img src={COVERS[seed % COVERS.length]} alt="Album artwork" className={cn("rounded-2xl shrink-0 object-cover", className)} />;
}

export function Chip({ children, tone = "soft", className }: { children: ReactNode; tone?: "soft" | "dark" | "blue" | "green" | "amber" | "red" | "pink"; className?: string }) {
  return <span className={cn("pk-chip", `pk-chip-${tone}`, className)}>{children}</span>;
}

export function OnAir({ small }: { small?: boolean }) {
  return <span className={cn("pk-onair", small && "text-[0.65rem] px-2 py-0.5")}><span className="pk-onair-dot" />ON AIR</span>;
}

export function MetaGenBand({ children }: { children: ReactNode }) {
  if (!SHOW_METAGEN_NOTES) return null;
  return <div className="pk-metagen"><strong>MetaGen side</strong><p>{children}</p></div>;
}

export function TrialNote({ children = "Free trial. You are not billed. We will tell you before that changes." }: { children?: ReactNode }) {
  const { state } = usePack();
  if (!state.testMode) return null;
  return <div className="pk-trial">{children}</div>;
}

export function Stanley({ className }: { className?: string }) {
  return <svg viewBox="0 0 120 100" className={cn("w-28 h-24", className)} aria-label="Stanley the dog">
    <path fill="currentColor" d="M22 38c-6-10-4-24 4-28 6 4 8 12 8 18 8-4 20-5 30-3 2-8 8-15 15-15 6 6 5 18 0 26 10 6 16 16 16 28 0 18-18 30-40 30S15 82 15 64c0-10 3-19 7-26Z" />
    <circle cx="46" cy="55" r="4" fill="var(--pk-peach)" /><circle cx="72" cy="55" r="4" fill="var(--pk-peach)" />
    <ellipse cx="59" cy="68" rx="7" ry="5" fill="var(--pk-peach)" />
  </svg>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="text-center py-10 text-pk-blue"><Stanley className="mx-auto" /><h3 className="pk-h3 mt-3 text-foreground">{title}</h3><p className="text-sm text-muted-foreground mt-1">{children}</p></div>;
}

export function Hero({ grad = "grad-hero", children, className }: { grad?: string; children: ReactNode; className?: string }) {
  return <section className={cn("pk-hero pk-dots", grad, className)}>
    <Link to="/" className="pk-hero-logo" aria-label="The Pack home"><PackLogo /></Link>
    <div className="pk-hero-content">{children}</div>
  </section>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("pk-card", className)}>{children}</div>;
}

/* ---------- Phone shell with bottom tabs ---------- */
type Tab = { to: string; label: string; icon: typeof Home };
const TABS_A: Tab[] = [{ to: "/saved", label: "Saved", icon: Bookmark }, { to: "/business/example-cafe", label: "Businesses", icon: Store }, { to: "/me", label: "Me", icon: User }];
const TABS_E: Tab[] = [{ to: "/home", label: "Home", icon: Home }, { to: "/library", label: "Library", icon: Library }, { to: "/map", label: "Map", icon: MapIcon }, { to: "/me", label: "Me", icon: User }];

export function Phone({ children, tabs = "e", role = "listener" }: { children: ReactNode; tabs?: "a" | "e" | "none"; role?: "listener" | "artist" | "business" }) {
  const path = useRouterState({ select: s => s.location.pathname });
  const list = tabs === "a" ? TABS_A : tabs === "e" ? TABS_E : [];
  return <div className="pk pk-phone min-h-screen">
    <div className={cn("pk-phone-frame min-h-screen flex flex-col shadow-xl", role !== "listener" && `pk-role-${role}`)}>
      <main className="flex-1 pb-24">{children}</main>
      {list.length > 0 && <nav className="pk-tabbar">{list.map(t => {
        const Icon = t.icon; const active = path.startsWith(t.to);
        return <Link key={t.to} to={t.to} activeProps={{}} className={cn("pk-tab", active && "active")}><Icon size={20} />{t.label}</Link>;
      })}</nav>}
    </div>
  </div>;
}

/* ---------- Desktop shell with left menu ---------- */
export type MenuItem = { to: string; label: string };
export function Desk({ area, grad, menu, children, top }: { area: string; grad: string; menu: MenuItem[]; children: ReactNode; top?: ReactNode }) {
  const path = useRouterState({ select: s => s.location.pathname });
  const { state } = usePack();
  return <div className={cn("pk pk-desk min-h-screen md:flex", grad)}>
    <aside className="pk-side">
      <Link to="/" className="pk-side-logo" aria-label="The Pack home"><PackLogo /></Link>
      <p className="pk-eyebrow mt-1 opacity-90">{area}</p>
      <nav className="mt-6 flex md:flex-col gap-1 overflow-x-auto">{menu.map(m =>
        <Link key={m.to} to={m.to} activeProps={{}} className={cn("pk-side-link", (path === m.to || path === m.to + "/" || (m.to.split("/").length > 2 && path.startsWith(m.to))) && "active")}>{m.label}</Link>)}
      </nav>
      {state.testMode && <p className="hidden md:block mt-auto pt-6 text-xs opacity-90">Test mode is on. Money is simulated.</p>}
    </aside>
    <main className="flex-1 min-w-0 p-4 md:p-8 max-w-6xl">{top}{children}</main>
  </div>;
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return <header className="mb-6">{eyebrow && <p className="pk-eyebrow text-pk-blue">{eyebrow}</p>}<h1 className="pk-h1 text-foreground">{title}</h1>{children && <div className="text-muted-foreground mt-2 max-w-2xl">{children}</div>}</header>;
}

export function Bar({ parts }: { parts: { label: string; value: number; cls: string }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  return <div>
    <div className="flex h-10 rounded-full overflow-hidden border-2 border-foreground">{parts.map(p =>
      <div key={p.label} className={cn(p.cls, "h-full")} style={{ width: `${(p.value / total) * 100}%` }} />)}</div>
    <div className="flex justify-between mt-2 text-sm font-semibold">{parts.map(p => <span key={p.label}>{p.label}</span>)}</div>
  </div>;
}
