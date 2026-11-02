import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Button,
  Check,
  Notice,
  PageTitle,
  Panel,
  TestModeNote,
  errorMessage,
} from "@/components/app/ui";
import { acceptLicensing } from "@/lib/business.functions";
import { useCurrentSite } from "./business";

export const Route = createFileRoute("/business/notice")({
  component: LicensingNotice,
});

type Block = { heading: string; body: string };

/** B1: honest about OneMusic, before the player switches on (VEN-7, D-25). */
function LicensingNotice() {
  const { business, site } = useCurrentSite();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [read, setRead] = useState(false);
  const [openData, setOpenData] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notice = business?.notice;
  const blocks = (Array.isArray(notice?.summary) ? notice.summary : []) as Block[];
  const isOwner = site?.access !== "staff";
  const accepted = !!site?.licensing_accepted_at;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await acceptLicensing({ data: { openData } });
      await queryClient.invalidateQueries({ queryKey: ["my-business"] });
      navigate({ to: "/business/player" });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle
        kicker={site?.businessName ?? ""}
        title={notice?.title ?? "Before you switch on The Pack"}
      />
      <Panel>
        <div className="space-y-5">
          {blocks.map((b) => (
            <div key={b.heading}>
              <h3 className="text-lg">{b.heading}</h3>
              <p className="mt-1 leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <TestModeNote show={!!business?.testMode}>
            Free trial. You are not billed. We will tell you before that changes.
          </TestModeNote>
        </div>
        {accepted ? (
          <Notice tone="ok">
            You've read this notice. It stays here so you can come back to it.
          </Notice>
        ) : isOwner ? (
          <div className="space-y-4">
            <Check checked={read} onChange={setRead}>
              I have read this and understand it.
            </Check>
            <Check checked={openData} onChange={setOpenData}>
              Include my site's aggregate data in the Open data project (optional). It's shared only
              at SA2 level, never identifies anyone, and you can opt out any time.
            </Check>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <Button variant="ember" disabled={!read || busy} onClick={submit}>
              {busy ? "Hold on…" : "Continue"}
            </Button>
          </div>
        ) : (
          <Notice>
            The business owner needs to read and accept this notice before the player can go on air.
          </Notice>
        )}
        {notice ? (
          <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-ink/50">
            Version {notice.version}
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
