import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Button,
  Field,
  Input,
  Notice,
  PageTitle,
  Panel,
  Select,
  Textarea,
  errorMessage,
} from "@/components/app/ui";
import { PackLogo } from "@/components/site/PackLogo";
import { inviteStaff, saveSite, type MySite } from "@/lib/business.functions";
import { useCurrentSite } from "./business";

export const Route = createFileRoute("/business/")({
  component: MySitePage,
});

const TYPES = [
  "Café",
  "Bar",
  "Restaurant",
  "Retail",
  "Salon",
  "Gym",
  "Waiting room",
  "Market",
  "Visitor centre",
];

/** B2: set up the site, get the QR kit, add staff (VEN-1, VEN-8, ACC-4). */
function MySitePage() {
  const { site, business } = useCurrentSite();
  if (!site || !business) return null;
  return (
    <>
      <PageTitle
        kicker="My site"
        title={site.name}
        lead="What the player plays, and what listeners see when they scan your code."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <SiteForm key={site.id} site={site} regions={business.regions} />
        <div className="space-y-6">
          <QrKit site={site} />
          <Staff site={site} />
        </div>
      </div>
    </>
  );
}

function SiteForm({ site, regions }: { site: MySite; regions: { code: string; name: string }[] }) {
  const queryClient = useQueryClient();
  const canEdit = site.access !== "staff";
  const [form, setForm] = useState({
    name: site.name,
    address: site.address,
    region: site.region ?? "",
    business_type: site.business_type,
    opening_hours: site.opening_hours,
    player_start: site.player_start.slice(0, 5),
    player_end: site.player_end.slice(0, 5),
    vibe: site.vibe,
  });
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await saveSite({ data: { siteId: site.id, ...form, region: form.region || null } });
      await queryClient.invalidateQueries({ queryKey: ["my-business"] });
      setStatus({ tone: "ok", text: "Saved." });
    } catch (e) {
      setStatus({ tone: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Your site">
      <form onSubmit={save} className="space-y-4">
        <fieldset disabled={!canEdit} className="space-y-4">
          <Field label="Site name">
            <Input required value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={set("address")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Region" hint="Lets local artists reach local listeners.">
              <Select value={form.region} onChange={set("region")}>
                <option value="">Choose a region</option>
                {regions.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Type">
              <Select value={form.business_type} onChange={set("business_type")}>
                {[...new Set([...TYPES, form.business_type])].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Opening hours">
            <Input value={form.opening_hours} onChange={set("opening_hours")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Player on from" hint="The hours we check the player is on air.">
              <Input type="time" value={form.player_start} onChange={set("player_start")} />
            </Field>
            <Field label="Player off at">
              <Input type="time" value={form.player_end} onChange={set("player_end")} />
            </Field>
          </div>
          <Field label="Vibe" hint="A short public description. It appears on your business page.">
            <Textarea value={form.vibe} maxLength={500} onChange={set("vibe")} />
          </Field>
        </fieldset>
        {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
        {canEdit ? (
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save site"}
          </Button>
        ) : (
          <Notice>Only the business owner can change the site profile.</Notice>
        )}
      </form>
    </Panel>
  );
}

export function useQrDataUrl(text: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!text) return;
    QRCode.toDataURL(text, {
      margin: 1,
      width: 480,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(setUrl, () => setUrl(null));
  }, [text]);
  return url;
}

function QrKit({ site }: { site: MySite }) {
  const link =
    typeof window === "undefined"
      ? `/c/${site.short_code}`
      : `${window.location.origin}/c/${site.short_code}`;
  const qr = useQrDataUrl(link);
  return (
    <Panel title="Your QR code and short link">
      <div className="flex flex-col items-center gap-3 text-center">
        {qr ? (
          <img
            src={qr}
            alt={`QR code for ${link}`}
            className="h-44 w-44 rounded-lg border-2 border-ink bg-paper p-1"
          />
        ) : null}
        <p className="break-all font-mono text-sm">{link.replace(/^https?:\/\//, "")}</p>
        <p className="text-sm">Scan to see what's playing here</p>
        <Button variant="yellow" onClick={() => window.print()}>
          Print sign kit
        </Button>
        <p className="text-xs text-ink/60">An A5 sign and a table card, ready to print.</p>
      </div>
      <SignKit site={site} qr={qr} link={link} />
    </Panel>
  );
}

/** Only visible when printing: an A5 sign and a table card (VEN-8, ADM-5). */
function SignKit({ site, qr, link }: { site: MySite; qr: string | null; link: string }) {
  return (
    <div className="pack-print-kit hidden">
      <style>{`
        @media print {
          @page { size: A5; margin: 10mm; }
          body * { visibility: hidden; }
          body::after { display: none; }
          .pack-print-kit, .pack-print-kit * { visibility: visible; }
          .pack-print-kit { display: block !important; position: absolute; inset: 0; }
          .pack-print-card { break-after: page; }
        }
      `}</style>
      {[0, 1].map((n) => (
        <div
          key={n}
          className="pack-print-card flex h-[180mm] flex-col items-center justify-center gap-6 text-center text-ink"
        >
          <PackLogo variant="full" className="h-24 text-ink" />
          <p className="font-display text-4xl font-bold uppercase">
            {n === 0 ? "Local music, playing here" : "What's playing?"}
          </p>
          {qr ? <img src={qr} alt="" className="h-64 w-64" /> : null}
          <p className="font-mono text-lg">{link.replace(/^https?:\/\//, "")}</p>
          <p className="text-lg">Scan to see what's playing at {site.name}. No app, no account.</p>
        </div>
      ))}
    </div>
  );
}

function Staff({ site }: { site: MySite }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canEdit = site.access !== "staff";
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const { token } = await inviteStaff({ data: { siteId: site.id, email } });
      setLink(`${origin}/invite/${token}`);
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["my-business"] });
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <Panel title="Staff">
      <ul className="space-y-2 text-sm">
        {site.staff.map((s) => (
          <li key={s.userId} className="flex justify-between gap-2">
            <span className="font-bold">{s.name || "Staff member"}</span>
            <span className="text-ink/60">Can run the player</span>
          </li>
        ))}
        {site.pendingStaff.map((s) => (
          <li key={s.token} className="flex justify-between gap-2">
            <span>{s.email}</span>
            <button
              type="button"
              className="text-xs font-bold uppercase underline"
              onClick={() => setLink(`${origin}/invite/${s.token}`)}
            >
              Invited · show link
            </button>
          </li>
        ))}
        {!site.staff.length && !site.pendingStaff.length ? (
          <li className="text-ink/60">No staff yet.</li>
        ) : null}
      </ul>
      {canEdit ? (
        <form onSubmit={invite} className="mt-4 space-y-3">
          <Field
            label="Add staff by email"
            hint="Staff can run the player. They can't change the site or the plan."
          >
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" variant="ghost" size="sm">
            Make invite link
          </Button>
        </form>
      ) : null}
      {link ? (
        <div className="mt-4">
          <Notice tone="ok">
            Send this single-use link to your staff member:
            <span className="mt-1 block break-all font-mono text-xs">{link}</span>
            <button
              type="button"
              className="mt-2 text-xs font-bold uppercase underline"
              onClick={() => navigator.clipboard?.writeText(link)}
            >
              Copy link
            </button>
          </Notice>
        </div>
      ) : null}
      {error ? (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}
    </Panel>
  );
}
