import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { PackLogo } from "@/components/site/PackLogo";
import { Stanley } from "@/components/site/blocks";
import { stanley } from "@/components/site/stanley";
import { supabase } from "@/integrations/supabase/client";

/*
 * The app's building blocks, in The Pack's own look: ink header, paper ground,
 * Fredoka headings, mono kickers, hard ink borders and pressable pills.
 * Colours only come from the brand tokens in styles.css.
 */

export type Tab = { to: string; label: string; exact?: boolean };

export function AppShell({
  area,
  areaColor = "text-yellow",
  title,
  tabs,
  children,
  wide = false,
}: {
  area: string;
  areaColor?: string;
  title?: string;
  tabs?: Tab[];
  children: ReactNode;
  wide?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 bg-ink text-paper">
        <div className={`mx-auto flex items-center gap-4 px-4 py-3 sm:px-6 ${wide ? "max-w-[96rem]" : "max-w-6xl"}`}>
          <Link to="/" aria-label="The Pack home">
            <PackLogo variant="full" className={`h-9 ${areaColor}`} />
          </Link>
          <span className={`font-mono text-xs uppercase tracking-[0.25em] ${areaColor}`}>{area}</span>
          {title ? <span className="hidden truncate font-mono text-xs uppercase tracking-[0.2em] text-paper/70 sm:inline">{title}</span> : null}
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/sign-in" });
            }}
            className="ml-auto font-mono text-xs uppercase tracking-[0.2em] text-paper/70 hover:text-yellow"
          >
            Sign out
          </button>
        </div>
        {tabs?.length ? (
          <nav className="border-t border-paper/15" aria-label={`${area} sections`}>
            <div className={`mx-auto flex gap-1 overflow-x-auto px-2 sm:px-4 ${wide ? "max-w-[96rem]" : "max-w-6xl"}`}>
              {tabs.map((tab) => {
                const active = tab.exact ? pathname === tab.to : pathname === tab.to || pathname.startsWith(`${tab.to}/`);
                return (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    className={`whitespace-nowrap border-b-4 px-3 py-2.5 font-mono text-xs uppercase tracking-[0.15em] ${
                      active ? "border-yellow text-yellow" : "border-transparent text-paper/75 hover:text-paper"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : null}
      </header>
      <main className={`mx-auto px-4 py-8 sm:px-6 ${wide ? "max-w-[96rem]" : "max-w-6xl"}`}>{children}</main>
    </div>
  );
}

/** Mobile-first frame for the public listener pages. */
export function PhoneShell({ children, tone = "grad-blue-magenta" }: { children: ReactNode; tone?: string }) {
  return (
    <div className={`wave-field min-h-screen ${tone} text-paper`}>
      <header className="mx-auto flex max-w-md items-center justify-between px-5 pt-5">
        <Link to="/" aria-label="The Pack">
          <PackLogo variant="full" className="h-10 text-paper" />
        </Link>
        <Link to="/saved" className="font-mono text-xs uppercase tracking-[0.2em] hover:text-yellow">
          Saved
        </Link>
      </header>
      <main className="mx-auto max-w-md px-5 pb-16 pt-6">{children}</main>
    </div>
  );
}

export function PageTitle({ kicker, title, lead, actions }: { kicker?: string; title: ReactNode; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {kicker ? <span className="stamp mono-kicker inline-block px-3 py-1">{kicker}</span> : null}
        <h1 className="mt-3 text-4xl sm:text-5xl">{title}</h1>
        {lead ? <p className="mt-3 text-base leading-relaxed text-ink/75 sm:text-lg">{lead}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  kicker,
  children,
  className = "",
  actions,
}: {
  title?: ReactNode;
  kicker?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border-2 border-ink bg-cream p-5 shadow-[4px_4px_0_0_var(--ink)] sm:p-6 ${className}`}>
      {title || kicker || actions ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {kicker ? <p className="mono-kicker text-ink/60">{kicker}</p> : null}
            {title ? <h2 className="mt-1 text-2xl [filter:none]">{title}</h2> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const BUTTON = {
  primary: "bg-electric text-paper",
  ember: "bg-ember text-paper",
  yellow: "bg-yellow text-ink",
  green: "bg-green text-ink",
  ghost: "bg-paper text-ink border-2 border-ink",
  danger: "bg-pink text-paper",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BUTTON; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-7 py-4 text-base" };
  return (
    <button
      type="button"
      {...props}
      className={`press inline-flex items-center justify-center gap-2 rounded-full font-bold uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON[variant]} ${sizes[size]} ${className}`}
    />
  );
}

export function ButtonLink({
  to,
  params,
  variant = "primary",
  children,
  className = "",
}: {
  to: string;
  params?: Record<string, string>;
  variant?: keyof typeof BUTTON;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      params={params as never}
      className={`press inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-widest ${BUTTON[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-xl border-2 border-ink bg-paper px-3.5 py-2.5 text-base text-ink outline-none focus:ring-4 focus:ring-yellow disabled:opacity-60";

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink/60">{hint}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-electric"
      />
      <span>{children}</span>
    </label>
  );
}

/** Release states use the same words everywhere (CAT-4). */
export const STATE_LABEL: Record<string, string> = {
  draft: "Draft",
  received: "Received",
  checking: "Checking",
  needs_attention: "Needs attention",
  held: "On hold",
  rejected: "Rejected",
  in_review: "In review",
  approved: "Approved",
  scheduled: "Scheduled",
  live: "Live",
  withdrawn: "Withdrawn",
  taken_down: "Taken down",
};

const STATE_TONE: Record<string, string> = {
  draft: "bg-paper text-ink",
  received: "bg-cyan-200 text-ink",
  checking: "bg-cyan-200 text-ink",
  needs_attention: "bg-ember text-paper",
  held: "bg-yellow text-ink",
  rejected: "bg-pink text-paper",
  in_review: "bg-electric text-paper",
  approved: "bg-green-300 text-ink",
  scheduled: "bg-green-300 text-ink",
  live: "bg-green text-ink",
  withdrawn: "bg-ink/15 text-ink",
  taken_down: "bg-ink text-paper",
};

export function StateBadge({ state }: { state: string }) {
  return <Badge className={STATE_TONE[state] ?? "bg-paper"}>{STATE_LABEL[state] ?? state}</Badge>;
}

export function Badge({ children, className = "bg-paper text-ink" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border-2 border-ink px-2.5 py-0.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] ${className}`}>
      {children}
    </span>
  );
}

export function OnAir({ state }: { state: "on_air" | "quiet" | "offline" }) {
  if (state === "on_air")
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-pink px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-paper" /> On air
      </span>
    );
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-ink/15 px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em]">
      {state === "quiet" ? "Quiet" : "Offline"}
    </span>
  );
}

/** Wording that exists only while Test mode is on (dashed amber box in the wireframes). */
export function TestModeNote({ children, show = true }: { children: ReactNode; show?: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-6 rounded-xl border-2 border-dashed border-ember bg-yellow-100 px-4 py-3 text-sm">
      <span className="mr-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ember">Test mode</span>
      {children}
    </div>
  );
}

export function Simulated() {
  return <Badge className="bg-yellow text-ink">Simulated</Badge>;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "ok"; children: ReactNode }) {
  const tones = { info: "bg-cyan-100", error: "bg-pink-100", ok: "bg-green-100" };
  return <div className={`rounded-xl border-2 border-ink px-4 py-3 text-sm font-medium ${tones[tone]}`}>{children}</div>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-ink/40 px-6 py-10 text-center">
      <Stanley src={stanley.listening} className="h-20 w-auto" />
      <p className="font-display text-xl font-bold uppercase">{title}</p>
      {children ? <div className="max-w-md text-sm text-ink/70">{children}</div> : null}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Stanley src={stanley.tailwag} alt="Loading" className="h-20 w-auto" />
    </div>
  );
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border-2 border-ink bg-paper">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="bg-ink text-paper">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.15em]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/15">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-top ${className}`}>{children}</td>;
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-paper p-4">
      <p className="mono-kicker text-ink/60">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
      {sub ? <p className="mt-1 text-xs text-ink/60">{sub}</p> : null}
    </div>
  );
}

export function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatCents(cents: number) {
  const abs = Math.abs(cents);
  return `${cents < 0 ? "-" : ""}$${Math.floor(abs / 100).toLocaleString("en-AU")}.${String(abs % 100).padStart(2, "0")}`;
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Try again.";
}
