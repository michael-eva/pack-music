import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { PackLogo } from "@/components/site/PackLogo";
import {
  Badge,
  Button,
  Field,
  Input,
  Loading,
  Notice,
  OnAir,
  PageTitle,
  Panel,
  Select,
  Table,
  Td,
  errorMessage,
} from "@/components/app/ui";
import { createSite, listSites } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/sites")({ component: Sites });

function ago(iso: string | null) {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 90) return `${s} s ago`;
  if (s < 5400) return `${Math.round(s / 60)} min ago`;
  if (s < 172800) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} days ago`;
}

/** D4: which sites are on air, from the player heartbeat (VEN-5, ADM-5). */
function Sites() {
  const q = useQuery({
    queryKey: ["admin", "sites"],
    queryFn: () => listSites(),
    refetchInterval: 20_000,
  });
  const [kit, setKit] = useState<{ name: string; code: string } | null>(null);

  if (q.isPending) return <Loading />;
  if (q.isError) return <Notice tone="error">{errorMessage(q.error)}</Notice>;
  const onAir = q.data.sites.filter((s) => s.state === "on_air").length;
  const reasons = Object.entries(q.data.skipReasons);

  return (
    <>
      <PageTitle
        kicker="Player heartbeat every 30 to 60 seconds"
        title="Sites"
        lead={`${onAir} of ${q.data.sites.length} on air now.`}
      />
      <Table
        head={["Site", "State", "Last heartbeat", "Player hours", "Playlist", "Skips today", ""]}
      >
        {q.data.sites.map((s) => (
          <tr key={s.id} className={s.state === "silent" ? "bg-pink-100" : ""}>
            <Td>
              <span className="font-bold">{s.name}</span>
              <span className="block text-xs text-ink/60">
                {s.businessName !== s.name ? `${s.businessName} · ` : ""}
                {s.address}
              </span>
              {!s.hasOwner ? <Badge className="mt-1 bg-yellow">Owner invited</Badge> : null}
            </Td>
            <Td>
              {s.state === "silent" ? (
                <Badge className="bg-pink text-paper">Silent, open now</Badge>
              ) : (
                <OnAir state={s.state === "on_air" ? "on_air" : "offline"} />
              )}
            </Td>
            <Td className="font-mono text-xs">{ago(s.lastHeartbeatAt)}</Td>
            <Td className="font-mono text-xs">{s.playerHours}</Td>
            <Td>{s.assignment ? `${s.assignment.playlist} v${s.assignment.version}` : "—"}</Td>
            <Td>{s.skipsToday}</Td>
            <Td>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setKit({ name: s.name, code: s.shortCode })}
              >
                QR kit
              </Button>
            </Td>
          </tr>
        ))}
      </Table>
      <p className="mt-3 text-sm text-ink/70">
        Skip reasons this week:{" "}
        {reasons.length ? reasons.map(([r, n]) => `${r} ${n}`).join(", ") : "none"}. Sent to the
        playlist's curator.
      </p>

      <NewSite regions={q.data.regions} />
      {kit ? <QrKit name={kit.name} code={kit.code} onClose={() => setKit(null)} /> : null}
    </>
  );
}

function NewSite({ regions }: { regions: { code: string; name: string }[] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    businessName: "",
    siteName: "",
    address: "",
    region: "",
    businessType: "Café",
    ownerEmail: "",
  });
  const [result, setResult] = useState<{ shortCode: string; inviteToken: string | null } | null>(
    null,
  );
  const create = useMutation({
    mutationFn: () => createSite({ data: { ...form, region: form.region || null } }),
    onSuccess: (r) => {
      setResult(r);
      setForm({
        businessName: "",
        siteName: "",
        address: "",
        region: "",
        businessType: "Café",
        ownerEmail: "",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "sites"] });
    },
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <Panel
      className="mt-8"
      title="Add a business and site"
      kicker="Pilot only: Admin creates businesses (ACC-4)"
    >
      <form
        className="grid gap-4 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Field label="Business name">
          <Input required value={form.businessName} onChange={set("businessName")} />
        </Field>
        <Field label="Site name">
          <Input required value={form.siteName} onChange={set("siteName")} />
        </Field>
        <Field label="Owner's email" hint="They get a single-use invite link.">
          <Input required type="email" value={form.ownerEmail} onChange={set("ownerEmail")} />
        </Field>
        <Field label="Address">
          <Input value={form.address} onChange={set("address")} />
        </Field>
        <Field label="Region">
          <Select value={form.region} onChange={set("region")}>
            <option value="">Choose…</option>
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Type">
          <Select value={form.businessType} onChange={set("businessType")}>
            {[
              "Café",
              "Bar",
              "Restaurant",
              "Retail",
              "Salon",
              "Gym",
              "Waiting room",
              "Market",
              "Visitor centre",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <div className="md:col-span-3">
          <Button type="submit" disabled={create.isPending}>
            Create site
          </Button>
        </div>
      </form>
      {create.isError ? (
        <div className="mt-3">
          <Notice tone="error">{errorMessage(create.error)}</Notice>
        </div>
      ) : null}
      {result ? (
        <div className="mt-4">
          <Notice tone="ok">
            Site created with short link <span className="font-mono">/c/{result.shortCode}</span>.
            {result.inviteToken ? (
              <>
                {" "}
                Send the owner this invite link (email sending isn't set up yet):{" "}
                <span className="break-all font-mono">{`${window.location.origin}/invite/${result.inviteToken}`}</span>
              </>
            ) : null}
          </Notice>
        </div>
      ) : null}
    </Panel>
  );
}

/** VEN-8 / ADM-5: the site's QR sign, ready to print. */
function QrKit({ name, code, onClose }: { name: string; code: string; onClose: () => void }) {
  const url = `${window.location.origin}/c/${code}`;
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(url, {
      margin: 1,
      width: 520,
      color: { dark: "#000000", light: "#f7f0e2" },
    }).then(setSrc);
  }, [url]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 print:static print:bg-transparent"
      role="dialog"
      aria-label={`QR kit for ${name}`}
    >
      <div className="max-h-full w-full max-w-md overflow-auto rounded-3xl border-2 border-ink bg-paper p-6 print:border-0">
        <div className="grad-blue-magenta rounded-2xl p-6 text-center text-paper">
          <PackLogo variant="full" className="mx-auto block h-14 text-yellow" />
          <p className="mt-4 font-display text-2xl font-bold uppercase">
            Scan to see what's playing here
          </p>
          {src ? (
            <img src={src} alt={`QR code for ${url}`} className="mx-auto mt-4 w-56 rounded-xl" />
          ) : (
            <div className="mx-auto mt-4 h-56 w-56" />
          )}
          <p className="mt-3 font-mono text-sm">{url.replace(/^https?:\/\//, "")}</p>
          <p className="mt-1 text-sm">{name}</p>
        </div>
        <p className="mt-4 text-sm text-ink/70">
          A5 sign. Print, or save the image for a window sticker or table card.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          <Button onClick={() => window.print()}>Print</Button>
          {src ? (
            <a
              href={src}
              download={`pack-qr-${code}.png`}
              className="press inline-flex items-center rounded-full bg-yellow px-5 py-2.5 text-sm font-bold uppercase tracking-widest"
            >
              Download QR
            </a>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
