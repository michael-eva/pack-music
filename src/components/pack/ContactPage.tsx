import { Card, Hero, Phone } from "./kit";

const EMAIL = "hello@packmusic.au";

export function ContactPage() {
  return <Phone>
    <Hero><p className="pk-eyebrow">Help</p><h1 className="pk-h1">Contact</h1><p className="text-sm mt-1">Pick a topic and we'll get back to you.</p></Hero>
    <div className="p-5 space-y-4">
      {[["Account", "Signing in, your details, closing your account."], ["Upload status", "Where your release is between MetaGen and The Pack."], ["Payments", "Memberships, subscriptions and earnings."]].map(([t, d]) =>
        <Card key={t}><h2 className="pk-h3">{t}</h2><p className="text-sm">{d}</p>
          <a className="pk-btn pk-btn-ghost mt-3 inline-flex" href={`mailto:${EMAIL}?subject=${encodeURIComponent(t!)}`}>Email us about {t!.toLowerCase()}</a></Card>)}
      <p className="text-sm text-center">Or write to <a className="underline font-bold" href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
    </div>
  </Phone>;
}
