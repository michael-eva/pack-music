import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Shell, BrandBackground } from "@/components/PackApp";
import { CheckInbox, PasswordMeter, roles, type Role } from "@/components/PackWelcome";
import { PASSWORD_MIN, TERMS_VERSION, checkNewPassword, requestPasswordReset, signUpListener, validatePostcode } from "@/lib/pack-auth";
import { usePack } from "@/lib/pack-store";

// Listener sign-up (LIS-6, ACC-7) and password reset (ACC-5). Artist and business accounts are invite-only (ACC-3, ACC-4).
function AuthFrame({ role, eyebrow, heading, back, children }: { role: Role; eyebrow: string; heading: string; back: ReactNode; children: ReactNode }) {
  const r = roles[role]; const Icon = r.icon;
  return <Shell mini={false} active="none" role={role === "government" ? "listener" : role} style={{ background: r.page }}>
    <section className="page-head pink"><BrandBackground src={r.banner}/>
      {back}
      <p className="eyebrow light"><Icon size={14}/> {eyebrow}</p><h1>{heading}</h1>
    </section>
    <section className="content narrow">
      {children}
      <p className="fineprint">No Facebook. No Google. No third-party tracking of who you are.</p>
    </section>
  </Shell>;
}

const BackToSignIn = ({ role }: { role: Role }) => <Link to="/sign-in" search={{ role }} className="back"><ArrowLeft/> Back to sign in</Link>;

export function SignUpApp() {
  const { set } = usePack(); const navigate = useNavigate();
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [displayName, setDisplayName] = useState(""); const [postcode, setPostcode] = useState("");
  const [news, setNews] = useState(false); const [terms, setTerms] = useState(false);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [err, setErr] = useState<string | null>(null);
  async function submit() {
    setErr(null);
    const res = await signUpListener(email, mode === "password" ? pw : undefined);
    if (!res.ok) return setErr(res.error ?? "Check your details.");
    if (!validatePostcode(postcode)) return setErr("Postcodes are four digits, like 6160.");
    if (!terms) return setErr("Tick the box to accept the Terms of Use and Privacy Policy.");
    setStep("verify");
  }
  function finish() {
    set(s => ({ ...s, user: {
      email: email.trim(), displayName: displayName.trim() || undefined, postcode: postcode.trim() || undefined, newsOptIn: news,
      terms: { version: TERMS_VERSION, acceptedAt: new Date().toISOString() },
    } }));
    navigate({ to: "/home" });
  }
  return <AuthFrame role="listener" eyebrow="I'm a listener" heading="Create your listener account." back={<BackToSignIn role="listener"/>}>
    <p className="lead">Keep your saves, playlists and “Heard at…” tags. All we need is your email.</p>
    {step === "form" && <div className="tabs">{(["magic", "password"] as const).map(m =>
      <button key={m} className={mode === m ? "active" : ""} onClick={() => { setMode(m); setErr(null); }}>{m === "magic" ? "Magic link" : "Email & password"}</button>)}
    </div>}
    <div className="form-card" style={{ boxShadow: `7px 7px 0 ${roles.listener.accent}` }}>
      {step === "verify"
        ? <CheckInbox continueLabel="I've tapped the link, continue" onContinue={finish} onChangeEmail={() => setStep("form")}>
            We've sent a link to <strong>{email.trim()}</strong>. Tap it to confirm your email{mode === "magic" ? " and sign in" : ""}.
          </CheckInbox>
        : <>
          <label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}/></label>
          {mode === "password" && <label>Password<input type="password" autoComplete="new-password" placeholder={`At least ${PASSWORD_MIN} characters`} value={pw} onChange={e => setPw(e.target.value)}/>
            <PasswordMeter password={pw}/>
            <span className="fineprint left">At least {PASSWORD_MIN} characters. Avoid common passwords.</span></label>}
          <label>Display name <span className="fineprint left">Optional. Shown only if you choose to follow an artist or business publicly.</span>
            <input type="text" autoComplete="nickname" value={displayName} onChange={e => setDisplayName(e.target.value)}/></label>
          <label>Postcode <span className="fineprint left">Optional. Helps us find music near you.</span>
            <input type="text" inputMode="numeric" autoComplete="postal-code" maxLength={4} placeholder="6160" value={postcode} onChange={e => setPostcode(e.target.value.replace(/\D/g, ""))}/></label>
          <label className="radio"><input type="checkbox" checked={news} onChange={e => setNews(e.target.checked)}/> Send me occasional news from The Pack, including when at-home listening opens.</label>
          <label className="radio"><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)}/> I accept the Terms of Use and Privacy Policy (version {TERMS_VERSION}).</label>
          {err && <div className="notice" role="alert">{err}</div>}
          <Button className="wide" onClick={submit}>{mode === "magic" ? <><Mail/> Email me a link</> : <>Create account <ArrowRight/></>}</Button>
          <p className="fineprint left">Already have an account? <Link to="/sign-in" search={{ role: "listener" }} className="underline font-bold">Sign in</Link></p>
        </>}
    </div>
  </AuthFrame>;
}

export function ForgotPasswordApp() {
  const { role } = useSearch({ from: "/forgot-password" }); const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function submit() {
    setErr(null);
    const res = await requestPasswordReset(email);
    if (!res.ok) return setErr(res.error ?? "Check your email address.");
    setSent(true);
  }
  return <AuthFrame role={role} eyebrow={roles[role].label} heading="Reset your password." back={<BackToSignIn role={role}/>}>
    <p className="lead">We'll email you a link to choose a new password.</p>
    <div className="form-card" style={{ boxShadow: `7px 7px 0 ${roles[role].accent}` }}>
      {sent
        ? <CheckInbox continueLabel="Open the reset link" onContinue={() => navigate({ to: "/reset-password", search: { role } })} onChangeEmail={() => setSent(false)}>
            If there's an account for <strong>{email.trim()}</strong>, we've sent it a link to choose a new password. The link works once.
          </CheckInbox>
        : <>
          <label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}/></label>
          {err && <div className="notice" role="alert">{err}</div>}
          <Button className="wide" onClick={submit}><Mail/> Email me a reset link</Button>
        </>}
    </div>
  </AuthFrame>;
}

export function ResetPasswordApp() {
  const { role } = useSearch({ from: "/reset-password" });
  const [pw, setPw] = useState(""); const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false); const [err, setErr] = useState<string | null>(null);
  function submit() {
    const res = checkNewPassword(pw, confirm);
    setErr(res.ok ? null : res.error ?? "Check your new password.");
    if (res.ok) setDone(true);
  }
  return <AuthFrame role={role} eyebrow={roles[role].label} heading="Choose a new password." back={<BackToSignIn role={role}/>}>
    <div className="form-card" style={{ boxShadow: `7px 7px 0 ${roles[role].accent}` }}>
      {done
        ? <>
          <div className="notice"><Check size={16}/> Password changed. Sign in with your new password.</div>
          <Button asChild className="wide"><Link to="/sign-in" search={{ role }}>Sign in <ArrowRight/></Link></Button>
        </>
        : <>
          <label>New password<input type="password" autoComplete="new-password" placeholder={`At least ${PASSWORD_MIN} characters`} value={pw} onChange={e => setPw(e.target.value)}/>
            <PasswordMeter password={pw}/>
            <span className="fineprint left">At least {PASSWORD_MIN} characters. Avoid common passwords.</span></label>
          <label>Confirm new password<input type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)}/></label>
          {err && <div className="notice" role="alert">{err}</div>}
          <Button className="wide" onClick={submit}>Save new password <ArrowRight/></Button>
        </>}
    </div>
  </AuthFrame>;
}
