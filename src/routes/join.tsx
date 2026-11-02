import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Footer } from "@/components/site/Footer";
import { PageHero, Slab, PageShell, TornPanel } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { submitSignup } from "@/lib/signup.functions";
import { T, useText } from "@/lib/site-text";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join The Pack – musician-owned streaming waitlist" },
      {
        name: "description",
        content:
          "Join the waitlist for The Pack: artists, listeners, businesses and councils. 70% of every dollar goes to the artists you play.",
      },
      { property: "og:title", content: "Join The Pack – musician-owned streaming waitlist" },
      {
        property: "og:description",
        content: "Get in before the first playlist drops. Free to join the waitlist.",
      },
      { property: "og:url", content: "/join" },
    ],
    links: [{ rel: "canonical", href: "/join" }],
  }),
  component: Join,
});

const ROLES = [
  { value: "artist", k: "join.role.artist", label: "I make music" },
  { value: "listener", k: "join.role.listener", label: "I listen" },
  { value: "business", k: "join.role.business", label: "I run a venue or business" },
  { value: "council", k: "join.role.council", label: "I work in local government" },
] as const;

const RULES_URL = "/api/public/doc/library/pack-coop-rules-2021.pdf";

const MEMBERSHIPS = [
  {
    k: "join.membership1",
    t: "Full Member – musician",
    d: "Voting rights, a direct revenue share, your own artist dashboard and access to the community forums. Free, no catch.",
  },
  {
    k: "join.membership2",
    t: "Associate Member – listener",
    d: "Subscription-based, with full streaming access, geo-fenced local discovery, fan rewards and a genuine place in the community.",
  },
  {
    k: "join.membership3",
    t: "Business Member",
    d: "Subscription-based, with business playlists, a rewards programme, geo-fenced artist discovery and data reporting.",
  },
  {
    k: "join.membership4",
    t: "Patron – local government",
    d: "A per-capita annual contribution, a data partnership, community promotion and a content asset pack to make it easy to run.",
  },
];

const OTHER_WAYS = [
  {
    k: "join.other1",
    t: "Support the campaign",
    d: "Our StartSomeGood campaign has a $45,000 target to finish the build and get us to launch.",
    to: "/support",
    cta: "Chip in",
  },
  {
    k: "join.other2",
    t: "Become an ambassador",
    d: "Put your name, face and platform behind a musician-owned streaming co-operative.",
    to: "/ambassador",
    cta: "Stand with us",
  },
  {
    k: "join.other3",
    t: "Become a patron",
    d: "Patronage tiers for organisations of every size, plus in-kind and custom partnerships.",
    to: "/patron",
    cta: "See the tiers",
  },
] as const;

type Status = "idle" | "sending" | "ok" | "duplicate" | "error";

function Join() {
  const send = useServerFn(submitSignup);
  const [status, setStatus] = useState<Status>("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const emailPlaceholder = useText("join.form.emailPlaceholder", "you@example.com");
  const namePlaceholder = useText("join.form.namePlaceholder", "Artist or your name");
  const locationPlaceholder = useText("join.form.locationPlaceholder", "Fremantle, 6160");
  const messagePlaceholder = useText(
    "join.form.messagePlaceholder",
    "Links, questions, the name of your band",
  );
  const emailError = useText("join.form.emailError", "Enter a valid email address.");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      setFieldError(emailError);
      return;
    }
    setFieldError(null);
    setStatus("sending");

    try {
      const result = await send({
        data: {
          email,
          name: String(fd.get("name") ?? "").slice(0, 100),
          role: String(fd.get("role") ?? "listener") as (typeof ROLES)[number]["value"],
          location: String(fd.get("location") ?? "").slice(0, 120),
          message: String(fd.get("message") ?? "").slice(0, 1000),
        },
      });
      setStatus(result.status === "ok" ? "ok" : result.status);
      if (result.status === "ok") form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <PageShell tone="deep">
      <PageHero
        tk="join.hero"
        gif={stanleyHero.backflip}
        gifPlain
        gifShadow="#ef4623"
      />

      <Slab>
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
          <form onSubmit={onSubmit} className="zine grain max-w-2xl p-6 sm:p-8">
            <fieldset className="border-0 p-0">
              <legend className="text-xs font-bold uppercase tracking-[0.3em]">
                <T k="join.form.roleLegend">I'm here as</T>
              </legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {ROLES.map((r, i) => (
                  <label
                    key={r.value}
                    className="flex cursor-pointer items-center gap-3 rounded-full bg-ink/5 px-5 py-3 text-sm font-bold transition-colors has-[:checked]:bg-yellow has-[:checked]:text-electric"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      defaultChecked={i === 0}
                      className="accent-electric"
                    />
                    <T k={r.k}>{r.label}</T>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-bold uppercase tracking-widest">
                <T k="join.form.emailLabel">Email</T>
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={255}
                  autoComplete="email"
                  className="mt-2 w-full rounded-2xl bg-ink/5 px-4 py-3 text-base font-normal normal-case tracking-normal outline-none ring-electric/0 transition focus:bg-paper focus:ring-2 focus:ring-electric"
                  placeholder={emailPlaceholder}
                />
              </label>
              <label className="block text-sm font-bold uppercase tracking-widest">
                <T k="join.form.nameLabel">Name</T>{" "}
                <span className="text-muted-foreground">
                  <T k="join.form.nameOptional">(optional)</T>
                </span>
                <input
                  name="name"
                  type="text"
                  maxLength={100}
                  autoComplete="name"
                  className="mt-2 w-full rounded-2xl bg-ink/5 px-4 py-3 text-base font-normal normal-case tracking-normal outline-none ring-electric/0 transition focus:bg-paper focus:ring-2 focus:ring-electric"
                  placeholder={namePlaceholder}
                />
              </label>
              <label className="block text-sm font-bold uppercase tracking-widest sm:col-span-2">
                <T k="join.form.locationLabel">Suburb or postcode</T>{" "}
                <span className="text-muted-foreground">
                  <T k="join.form.locationOptional">(optional)</T>
                </span>
                <input
                  name="location"
                  type="text"
                  maxLength={120}
                  className="mt-2 w-full rounded-2xl bg-ink/5 px-4 py-3 text-base font-normal normal-case tracking-normal outline-none ring-electric/0 transition focus:bg-paper focus:ring-2 focus:ring-electric"
                  placeholder={locationPlaceholder}
                />
              </label>
              <label className="block text-sm font-bold uppercase tracking-widest sm:col-span-2">
                <T k="join.form.messageLabel">Anything else?</T>{" "}
                <span className="text-muted-foreground">
                  <T k="join.form.messageOptional">(optional)</T>
                </span>
                <textarea
                  name="message"
                  rows={4}
                  maxLength={1000}
                  className="mt-2 w-full rounded-2xl bg-ink/5 px-4 py-3 text-base font-normal normal-case tracking-normal outline-none ring-electric/0 transition focus:bg-paper focus:ring-2 focus:ring-electric"
                  placeholder={messagePlaceholder}
                />
              </label>
            </div>

            {fieldError ? (
              <p className="mt-4 text-sm font-bold text-destructive">{fieldError}</p>
            ) : null}

            <button
              type="submit"
              disabled={status === "sending"}
              className="press mt-8 rounded-full bg-ember px-8 py-4 font-display text-lg uppercase tracking-wide text-paper disabled:opacity-60"
            >
              {status === "sending" ? <T k="join.form.sending">Sending…</T> : <T k="join.form.submit">Join the Pack</T>}
            </button>

            <p aria-live="polite" className="mt-5 text-base font-bold">
              {status === "ok" ? (
                <T k="join.form.successOk">You're in. We'll be in touch before launch.</T>
              ) : null}
              {status === "duplicate" ? (
                <T k="join.form.successDuplicate">You're already on the list – nice work.</T>
              ) : null}
              {status === "error" ? (
                <T k="join.form.successError">Something went wrong. Try again in a moment.</T>
              ) : null}
            </p>
          </form>

          <aside className="zine grain tilt-r p-6">
            <p className="font-display text-2xl uppercase">
              <T k="join.aside.heading">What you're joining</T>
            </p>
            <ul className="mt-4 space-y-3 text-base">
              <li>
                <T k="join.aside.point1">70% of your subscription paid to the artists you play.</T>
              </li>
              <li>
                <T k="join.aside.point2">A co-operative: one member, one vote.</T>
              </li>
              <li>
                <T k="join.aside.point3">Human-curated discovery in your own postcode.</T>
              </li>
            </ul>
            <div className="mt-6 flex items-center gap-4">
              <p className="rounded-2xl bg-yellow px-4 py-3 text-sm font-bold uppercase tracking-widest text-electric">
                <T k="join.aside.stanley">Stanley says: welcome to the pack.</T>
              </p>
            </div>
          </aside>
        </div>
      </Slab>

      <Slab>
        <h2 className="text-4xl sm:text-5xl">
          <T k="join.membershipHeading">Membership types</T>
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {MEMBERSHIPS.map((m) => (
            <div key={m.k} className="zine grain p-6">
              <h3 className="font-display text-xl uppercase">
                <T k={`${m.k}.title`}>{m.t}</T>
              </h3>
              <p className="mt-2 text-base leading-relaxed">
                <T k={`${m.k}.body`}>{m.d}</T>
              </p>
            </div>
          ))}
        </div>

        <TornPanel tilt="l" className="mt-12 max-w-3xl px-8 pb-8 pt-10">
          <h3 className="font-display text-2xl uppercase">
            <T k="join.rules.heading">Before you join, understand the commitment</T>
          </h3>
          <p className="mt-3 text-lg leading-relaxed">
            <T k="join.rules.body1">
              Every Pack member agrees to abide by the co-op rules – our registered governing
              documents, not a formality you skim past. They cover how the co-operative is governed,
              how decisions get made, how revenue is distributed, how disputes get resolved, and what
              membership means once you're in it.
            </T>
          </p>
          <p className="mt-4 text-lg leading-relaxed">
            <T k="join.rules.body2">
              We're not telling you this to put you off. The co-op rules are what make The Pack
              genuinely different from every other streaming service, and they're what protect you
              once you've joined. Stanley reads the fine print so you never feel like you're signing
              in the dark.
            </T>
          </p>
          <a
            href={RULES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="press mt-6 inline-flex rounded-full bg-yellow px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
          >
            <T k="join.rules.cta">Read the co-op rules</T>
          </a>
        </TornPanel>
      </Slab>

      <Slab>
        <h2 className="text-4xl sm:text-5xl">
          <T k="join.otherHeading">Other ways in</T>
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {OTHER_WAYS.map((w, i) => (
            <TornPanel key={w.to} tilt={i % 2 ? "r" : "l"} className="flex flex-col px-8 pb-8 pt-10">
              <h3 className="font-display text-2xl uppercase">
                <T k={`${w.k}.title`}>{w.t}</T>
              </h3>
              <p className="mt-3 flex-1 text-base leading-relaxed">
                <T k={`${w.k}.body`}>{w.d}</T>
              </p>
              <Link
                to={w.to}
                className="press mt-6 inline-flex self-start rounded-full bg-yellow px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
              >
                <T k={`${w.k}.cta`}>{w.cta}</T>
              </Link>
            </TornPanel>
          ))}
        </div>
      </Slab>
      <Footer dark />
    </PageShell>
  );
}
