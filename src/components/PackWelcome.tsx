import { Link, useSearch } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Building2, Check, Headphones, Landmark, Mail, Music2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PASSWORD_MIN, passwordStrength, requestEmailLink, signInWithPassword, validateAbn, validateOtp } from "@/lib/pack-auth";
import { usePack } from "@/lib/pack-store";
import { Button } from "@/components/ui/button";
import { Shell, BrandBackground } from "@/components/PackApp";
import bluePink from "@/assets/pack-blue-pink-stanley.jpg";
import pinkPeach from "@/assets/pack-pink-peach-stanley.jpg";
import blueGreen from "@/assets/pack-blue-green.jpg";
import orangeYellow from "@/assets/pack-orange-yellow.jpg";

export type Role = "listener" | "artist" | "business" | "government";

export const roles: Record<Role, {
  label: string; icon: typeof Headphones; blurb: string; accent: string; price: string;
  heading: string; lead: string; extraFields: string[]; nextLabel: string; nextTo: "/home" | "/artist-portal/join" | "/biz" | "/membership"; nextCopy: string;
  grad: string; page: string; banner: string; solid: string; step: string; role: string; priceShort: string; cycleLabel: string;
}> = {
  listener: {
    label: "I'm a listener", icon: Headphones, accent: "var(--pack-blue)",
    blurb: "Hear what's playing around you, save it, keep it.", price: "$9.99 / month · patron top-ups optional",
    heading: "Listener sign-in.", lead: "Your saves, playlists and “Heard at…” tags live here.",
    extraFields: [], nextLabel: "Enter your feed", nextTo: "/home",
    nextCopy: "Takes you to your curated home feed and library.",
    grad:"linear-gradient(160deg,oklch(0.50 0.30 266),oklch(0.55 0.30 305) 55%,oklch(0.62 0.29 340))",
    page:"linear-gradient(180deg,oklch(0.46 0.30 266),oklch(0.54 0.30 300) 45%,oklch(0.64 0.29 342))",
    banner: bluePink,
    solid: "oklch(0.52 0.27 268)", step: "01", role: "Listen", priceShort: "$9.99 / mo", cycleLabel: "Listener",
  },
  artist: {
    label: "I'm an artist", icon: Music2, accent: "var(--pack-pink)",
    blurb: "Upload your music, grow your audience, watch your earnings.", price: "Free · optional Band Page $10 / month",
    heading: "Artist sign-in.", lead: "A separate door into your own workspace — uploads, catalogue, earnings and payouts.",
    extraFields: ["Artist or band name"],
    nextLabel: "Open artist workspace", nextTo: "/artist-portal/join",
    nextCopy: "Artists land in the workspace, not the listener feed — your catalogue, earnings and data export are all in one place.",
    grad:"linear-gradient(160deg,oklch(0.60 0.28 350),oklch(0.66 0.21 20) 55%,oklch(0.72 0.16 62))",
    page:"linear-gradient(180deg,oklch(0.56 0.29 348),oklch(0.65 0.21 18) 50%,oklch(0.74 0.16 68))",
    banner: pinkPeach,
    solid: "oklch(0.58 0.27 350)", step: "02", role: "Create", priceShort: "Free", cycleLabel: "Creator",
  },
  business: {
    label: "I run a business", icon: Building2, accent: "var(--pack-orange)",
    blurb: "Play local music in your café, shop, bar or gym.", price: "$49.99 / site / month during the pilot",
    heading: "Business sign-in.", lead: "Your player, your public page, your subscription and OneMusic notice.",
    extraFields: ["Business name", "ABN"], nextLabel: "Open the business player", nextTo: "/biz",
    nextCopy: "$49.99 per site per month during the pilot. Pricing will be tiered by annual turnover after the pilot.",
    grad:"linear-gradient(160deg,oklch(0.63 0.20 45),oklch(0.69 0.17 70) 55%,oklch(0.76 0.16 92))",
    page:"linear-gradient(180deg,oklch(0.60 0.21 40),oklch(0.69 0.17 68) 50%,oklch(0.78 0.16 95))",
    banner: orangeYellow,
    solid: "oklch(0.62 0.19 48)", step: "03", role: "Play", priceShort: "$49.99 / site / mo", cycleLabel: "Business Owner",
  },
  government: {
    label: "Local or State government", icon: Landmark, accent: "var(--pack-green)",
    blurb: "Music in public spaces, with patronage built in.", price: "Tiered by population or space capacity",
    heading: "Government sign-in.", lead: "Manage public spaces and your patronage level.",
    extraFields: ["Agency or council name", "Contact role"], nextLabel: "View tiers", nextTo: "/membership",
    nextCopy: "LGAs are tiered by population; State government spaces are priced per space and capacity.",
    grad:"linear-gradient(160deg,oklch(0.60 0.14 200),oklch(0.63 0.17 165) 55%,oklch(0.68 0.19 145))",
    page:"linear-gradient(180deg,oklch(0.58 0.14 205),oklch(0.63 0.17 168) 50%,oklch(0.70 0.19 145))",
    banner: blueGreen,
    solid: "oklch(0.58 0.16 168)", step: "04", role: "Fund", priceShort: "tiered", cycleLabel: "Patron",
  },
};

// Government is hidden for the pilot: its sign-in falls back to the listener pathway.
const signInRoles: Role[] = ["listener", "artist", "business"];
export const parseRole = (search: Record<string, unknown>): { role: Role } => {
  const role = String(search["role"] ?? "listener") as Role;
  return { role: signInRoles.includes(role) ? role : "listener" };
};

export function PasswordMeter({ password }: { password: string }) {
  if (!password) return null;
  const strength = passwordStrength(password); const bars = strength === "Weak" ? 1 : strength === "OK" ? 2 : 3;
  return <span className="pw-meter" aria-live="polite">{[1, 2, 3].map(i => <span key={i} className={i <= bars ? "on" : ""}/>)} {strength}</span>;
}

// No real email is sent yet, so the continue button stands in for tapping the emailed link.
export function CheckInbox({ children, continueLabel, onContinue, onChangeEmail }: { children: ReactNode; continueLabel: string; onContinue: () => void; onChangeEmail: () => void }) {
  const [resent, setResent] = useState(false);
  return <>
    <h3><Mail size={18} className="inline mr-2"/>Check your inbox</h3>
    <p>{children}</p>
    {resent && <div className="notice"><Check size={16}/> Sent again. It can take a minute to arrive.</div>}
    <Button className="wide" onClick={onContinue}>{continueLabel} <ArrowRight/></Button>
    <p className="fineprint left">Simulated: there's no real email yet, so this button stands in for tapping the link.</p>
    <p className="fineprint left">
      <button type="button" className="underline font-bold" onClick={() => setResent(true)}>Send it again</button> · <button type="button" className="underline font-bold" onClick={onChangeEmail}>Use a different email</button>
    </p>
  </>;
}

export function WelcomeApp() {
  const entryPoints: Array<{ key: Role; title: string; copy: string; action: string }> = [
    { key: "artist", title: "Musicians", copy: "Share your music, grow your audience and manage your catalogue.", action: "Enter the artist workspace" },
    { key: "listener", title: "Listeners", copy: "Discover local music, follow your favourite artists and build playlists.", action: "Discover local music" },
    { key: "business", title: "Businesses", copy: "Play local music in your café, shop, bar, gym or other business.", action: "Open the business player" },
  ];

  return <Shell mini={false} active="none">
    <section className="hero welcome-hero"><BrandBackground src={bluePink}/>
      <p className="eyebrow light">Co-operative streaming, made close to home</p>
      <h1>Streaming that puts <span className="hl-yellow">musicians first.</span> Finally.</h1>
      <p>The Pack is a community, not a streaming service. Musicians own it, listeners fuel it, and 70% of every subscription goes straight into artists' pockets.</p>
    </section>
    <section className="content welcome-content">
      <div className="entry-grid">
        {entryPoints.map(({ key, title, copy, action }, i) => {
          return <Link key={key} to="/sign-in" search={{ role: key }} className={`entry-card entry-${key}`}>
            <span className="entry-eyebrow">Pathway {String(i + 1).padStart(2, "0")}</span>
            <div className="entry-copy">
              <h2>{title}</h2>
              <p>{copy}</p>
            </div>
            <span className="entry-action">{action}<ArrowRight/></span>
          </Link>;
        })}
      </div>
      <p className="fineprint">No Facebook. No Google. No third-party tracking of who you are.</p>
    </section>
  </Shell>;
}

export function SignInApp() {
  const { role } = useSearch({ from: "/sign-in" });
  const r = roles[role]; const Icon = r.icon;
  const { set } = usePack();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [abn, setAbn] = useState(""); const [abnOk, setAbnOk] = useState(false);
  const [step, setStep] = useState<"form" | "code">("form"); const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const needsCode = role === "artist" || role === "business";
  const abnValid = validateAbn(abn);
  const go = () => { set(s => ({ ...s, user: { ...(s.user?.email === email.trim() ? s.user : {}), email: email.trim() } })); navigate({ to: r.nextTo }); };
  const signedIn = () => needsCode ? setStep("code") : go();
  async function submit() {
    setErr(null);
    if (role === "business" && !(abnValid && abnOk)) { setErr("Enter a valid ABN and confirm the registered business name."); return; }
    const res = mode === "password" ? await signInWithPassword(email, pw) : await requestEmailLink(email);
    if (!res.ok) { setErr(res.error ?? "Check your details."); return; }
    if (mode === "magic") setSent(true); else signedIn();
  }
  return <Shell mini={false} active="none" role={role === "government" ? "listener" : role} style={{ background: r.page }}>
    <section className="page-head pink"><BrandBackground src={r.banner}/>
      <Link to="/" className="back"><ArrowLeft/> Choose a different pathway</Link>
      <p className="eyebrow light"><Icon size={14}/> {r.label}</p><h1>{r.heading}</h1>
    </section>
    <section className="content narrow">
      <p className="lead">{r.lead}</p>
      {step === "form" && !sent && <div className="tabs">{(["password", "magic"] as const).map(m =>
        <button key={m} className={mode === m ? "active" : ""} onClick={() => { setMode(m); setErr(null); }}>{m === "password" ? "Email & password" : "Magic link"}</button>)}
      </div>}
      <div className="form-card" style={{ boxShadow: `7px 7px 0 ${r.accent}` }}>
        {step === "code" ? <>
          <h3>Two-step sign-in</h3>
          <p>Enter the 6-digit code from your authenticator app (simulated: any 6 digits).</p>
          <label>6-digit code<input inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456"/></label>
          {err && <div className="notice">{err}</div>}
          <Button className="wide" onClick={() => validateOtp(code) ? go() : setErr("The code needs exactly 6 digits.")}>{r.nextLabel} <ArrowRight/></Button>
        </> : sent ? <CheckInbox continueLabel="I've tapped the link, continue" onContinue={signedIn} onChangeEmail={() => setSent(false)}>
            We've sent a one-time sign-in link to <strong>{email.trim()}</strong>.
          </CheckInbox> : <>
        <label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}/></label>
        {r.extraFields.map(f => f === "ABN"
          ? <label key={f}>ABN<input type="text" inputMode="numeric" value={abn} onChange={e => { setAbn(e.target.value); setAbnOk(false); }} placeholder="11 digits"/>
              {abn.replace(/\s/g, "").length === 11 && (abnValid
                ? <span className="notice"><Check size={16}/> Checked against the Australian Business Register (simulated): <strong>Example Café Pty Ltd</strong>
                    <span className="radio"><input type="checkbox" checked={abnOk} onChange={e => setAbnOk(e.target.checked)}/> This is my business</span></span>
                : <span className="notice">That ABN doesn't pass the check. Check the number and try again.</span>)}
            </label>
          : <label key={f}>{f}<input type="text"/></label>)}
        {mode === "password" && <label>Password<input type="password" autoComplete="current-password" placeholder={`At least ${PASSWORD_MIN} characters`} value={pw} onChange={e => setPw(e.target.value)}/>
          <PasswordMeter password={pw}/>
          <span className="fineprint left">At least {PASSWORD_MIN} characters. Avoid common passwords.{needsCode ? " You'll then enter a code from your authenticator app." : ""}</span></label>}
        {err && <div className="notice" role="alert">{err}</div>}
        <Button className="wide" onClick={submit}>{mode === "magic" ? <><Mail/> Email me a link</> : <>{needsCode ? "Continue" : r.nextLabel} <ArrowRight/></>}</Button>
        {mode === "password" && <p className="fineprint left"><Link to="/forgot-password" search={{ role }} className="underline font-bold">Forgot your password?</Link></p>}
        </>}
        <p className="fineprint left">{r.nextCopy}</p>
      </div>
      {role === "listener"
        ? <p className="fineprint">New to The Pack? <Link to="/sign-up" className="underline font-bold">Create a listener account</Link></p>
        : <p className="fineprint">{role === "artist" ? "Artist" : "Business"} accounts are by invitation during the pilot. <Link to="/contact" className="underline font-bold">Contact The Pack</Link></p>}
      <p className="fineprint">No Facebook. No Google. No third-party tracking of who you are.</p>
    </section>
  </Shell>;
}
