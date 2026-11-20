import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { requestEmailLink, signInWithPassword } from "@/lib/pack-auth";
import { usePack } from "@/lib/pack-store";

export function SignInSheet({ open, onOpenChange, title, lead, onSignedIn }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; lead: string; onSignedIn: () => void;
}) {
  const { set } = usePack();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"link" | "password">("link");
  const [step, setStep] = useState<"form" | "check">("form");
  const [error, setError] = useState("");

  const finish = () => { set(s => ({ ...s, user: { email } })); setStep("form"); onSignedIn(); onOpenChange(false); };
  const submit = async () => {
    setError("");
    const r = mode === "link" ? await requestEmailLink(email) : await signInWithPassword(email, password);
    if (!r.ok) return setError(r.error ?? "Something went wrong.");
    if (mode === "link") setStep("check"); else finish();
  };

  return <Sheet open={open} onOpenChange={o => { onOpenChange(o); if (!o) setStep("form"); }}>
    <SheetContent side="bottom" className="pk rounded-t-3xl max-w-md mx-auto border-2 border-pk-black">
      {step === "form" ? <>
        <SheetHeader className="text-left p-0 mb-4"><SheetTitle className="pk-h2">{title}</SheetTitle><SheetDescription>{lead}</SheetDescription></SheetHeader>
        <label className="pk-label">Email<input className="pk-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        {mode === "password" && <label className="pk-label">Password<input className="pk-input" type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>}
        {error && <p className="text-sm font-semibold text-pk-orange mb-2">{error}</p>}
        <button className="pk-btn w-full" onClick={submit}>{mode === "link" ? "Email me a link" : "Sign in"}</button>
        <button className="w-full mt-3 text-sm font-bold underline" onClick={() => setMode(mode === "link" ? "password" : "link")}>{mode === "link" ? "or use a password" : "or email me a link"}</button>
      </> : <>
        <SheetHeader className="text-left p-0 mb-4"><SheetTitle className="pk-h2">Check your email</SheetTitle><SheetDescription>We sent a sign-in link to {email}. Tap it to carry on.</SheetDescription></SheetHeader>
        <button className="pk-btn w-full" onClick={finish}>I've tapped the link, continue</button>
      </>}
    </SheetContent>
  </Sheet>;
}
