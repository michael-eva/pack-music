import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Footer } from "@/components/site/Footer";
import { JoinCta, PageHero, PageShell, Slab } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { submitContact } from "@/lib/contact.functions";
import { T, useText } from "@/lib/site-text";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact The Pack – say hello" },
      {
        name: "description",
        content:
          "Questions, ideas, partnerships or press? Email hello@packmusic.au or send The Pack Music Co-operative a message.",
      },
      { property: "og:title", content: "Contact The Pack – say hello" },
      {
        property: "og:description",
        content: "Reach the musician-owned streaming co-operative: hello@packmusic.au.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

type Status = "idle" | "sending" | "ok" | "error";

const field =
  "mt-2 w-full rounded-2xl bg-ink/5 px-4 py-3 text-base font-normal normal-case tracking-normal outline-none ring-electric/0 transition focus:bg-paper focus:ring-2 focus:ring-electric";

function Contact() {
  const send = useServerFn(submitContact);
  const [status, setStatus] = useState<Status>("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const namePlaceholder = useText("contact.form.namePlaceholder", "Your name");
  const emailPlaceholder = useText("contact.form.emailPlaceholder", "you@example.com");
  const messagePlaceholder = useText("contact.form.messagePlaceholder", "What's on your mind?");
  const validationError = useText("contact.form.error", "We need a name, a valid email and a message.");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(validationError);
      return;
    }
    setFieldError(null);
    setStatus("sending");

    try {
      const result = await send({
        data: { name: name.slice(0, 120), email, message: message.slice(0, 4000) },
      });
      setStatus(result.status === "ok" ? "ok" : "error");
      if (result.status === "ok") form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <PageShell tone="magenta">
      <PageHero
        tk="contact.hero"
        gif={stanleyHero.barking}
        gifPlain
        gifShadow="#00ffff"
      />

      <Slab>
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
          <form onSubmit={onSubmit} className="zine grain max-w-2xl p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-bold uppercase tracking-widest">
                <T k="contact.form.nameLabel">Name</T>
                <input name="name" type="text" required maxLength={120} autoComplete="name" className={field} placeholder={namePlaceholder} />
              </label>
              <label className="block text-sm font-bold uppercase tracking-widest">
                <T k="contact.form.emailLabel">Email</T>
                <input name="email" type="email" required maxLength={255} autoComplete="email" className={field} placeholder={emailPlaceholder} />
              </label>
              <label className="block text-sm font-bold uppercase tracking-widest sm:col-span-2">
                <T k="contact.form.messageLabel">Message</T>
                <textarea name="message" rows={6} required maxLength={4000} className={field} placeholder={messagePlaceholder} />
              </label>
            </div>

            {fieldError ? <p className="mt-4 text-sm font-bold text-destructive">{fieldError}</p> : null}

            <button
              type="submit"
              disabled={status === "sending"}
              className="press mt-8 rounded-full bg-electric px-8 py-4 font-display text-lg uppercase tracking-wide text-paper disabled:opacity-60"
            >
              {status === "sending" ? <T k="contact.form.sending">Sending…</T> : <T k="contact.form.submit">Send it</T>}
            </button>

            <p aria-live="polite" className="mt-5 text-base font-bold">
              {status === "ok" ? <T k="contact.form.successOk">Got it. We'll write back soon.</T> : null}
              {status === "error" ? (
                <T k="contact.form.successError">Something went wrong – email hello@packmusic.au instead.</T>
              ) : null}
            </p>
          </form>

          <aside className="zine grain tilt-r p-6">
            <p className="font-display text-2xl uppercase">
              <T k="contact.aside.heading">Or just email us</T>
            </p>
            <a
              href="mailto:hello@packmusic.au"
              className="mt-3 inline-block text-lg font-bold underline decoration-2 underline-offset-4"
            >
              hello@packmusic.au
            </a>
            <p className="mt-5 text-base leading-relaxed">
              <T k="contact.aside.location">
                We're a co-operative made on Whadjuk Noongar Boodja, Perth, Western Australia.
              </T>
            </p>
            <p className="mt-4 rounded-2xl bg-yellow px-4 py-3 text-sm font-bold uppercase tracking-widest text-electric">
              <T k="contact.aside.stanley">Stanley says: he answers faster than the humans.</T>
            </p>
          </aside>
        </div>

        <div className="mt-12">
          <JoinCta />
        </div>
      </Slab>

      <Footer dark={false} />
    </PageShell>
  );
}
