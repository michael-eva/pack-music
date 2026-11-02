import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel, TestModeNote, formatCents } from "@/components/app/ui";
import { splitFee } from "@/lib/ledger/engine";
import { useCurrentSite } from "./business";

export const Route = createFileRoute("/business/plan")({
  component: PlanPage,
});

/** B4: one flat price per site, and where it goes (VEN-9, PAY-2). */
function PlanPage() {
  const { business, site } = useCurrentSite();
  if (!business || !site) return null;
  const sites = business.sites;
  const fee = site.fee_cents;
  const { artistPoolCents, packCents } = splitFee(fee, business.artistShareBp);
  const artistPct = business.artistShareBp / 100;

  return (
    <div className="max-w-3xl">
      <PageTitle kicker="My plan" title="Your plan" />
      <TestModeNote show={business.testMode}>
        Free trial. You are not billed. We will tell you before that changes.
      </TestModeNote>
      <div className="grid gap-6 md:grid-cols-2">
        <Panel title={`${formatCents(fee)} per site, per month`}>
          <p className="leading-relaxed">The same price however busy your site gets.</p>
          <p className="mt-3 text-sm text-ink/70">
            {sites.length} {sites.length === 1 ? "site" : "sites"}:{" "}
            {sites.map((s) => s.name).join(", ")}.
          </p>
        </Panel>
        <Panel title="Where your fee goes">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3 rounded-xl bg-green-200 px-4 py-3">
              <span className="font-display text-3xl font-bold">
                {formatCents(artistPoolCents)}
              </span>
              <span className="text-right text-sm">
                to the artists played at your site ({artistPct}%)
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 rounded-xl bg-paper px-4 py-3">
              <span className="font-display text-3xl font-bold">{formatCents(packCents)}</span>
              <span className="text-right text-sm">to The Pack ({100 - artistPct}%)</span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink/70">
            Your fee pays only the artists played at your site that month, shared by how often each
            was played. It is never pooled with other businesses.
          </p>
        </Panel>
      </div>
    </div>
  );
}
