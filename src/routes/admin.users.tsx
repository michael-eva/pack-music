import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Badge,
  Button,
  Field,
  Input,
  Loading,
  Notice,
  PageTitle,
  Panel,
  Select,
  Table,
  Td,
  errorMessage,
} from "@/components/app/ui";
import { createInvite, listUsers, resendInvite, setUserActive } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/users")({ component: Users });

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  curator: "Curator",
  artist: "Artist",
  business_owner: "Business owner",
  business_staff: "Business staff",
  listener: "Listener",
};

const STATUS_TONE: Record<string, string> = {
  Invited: "bg-cyan-200",
  "Invite expired": "bg-ink/15",
  "Membership pending": "bg-yellow",
  Joined: "bg-green",
  Deactivated: "bg-ink text-paper",
};

/** D1: invite artists and businesses, one list across roles (ACC-3, ADM-3, ADM-8). */
function Users() {
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "users"], queryFn: () => listUsers() });
  const [cohort, setCohort] = useState("");
  const [role, setRole] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  const showLink = (token: string) => setLink(`${window.location.origin}/invite/${token}`);

  const resend = useMutation({
    mutationFn: (inviteId: string) => resendInvite({ data: { inviteId } }),
    onSuccess: (r) => (showLink(r.token), refresh()),
  });
  const active = useMutation({
    mutationFn: (v: { userId: string; active: boolean }) => setUserActive({ data: v }),
    onSuccess: refresh,
  });

  return (
    <>
      <PageTitle
        kicker="Pilot: invite only"
        title="Users"
        lead="Invite links are single use and tied to a cohort label. Open sign-up with review starts in Phase 2."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <InviteForm kind="artist" onCreated={(t) => (showLink(t), refresh())} />
        <InviteForm kind="business_owner" onCreated={(t) => (showLink(t), refresh())} />
        <InviteForm kind="curator" onCreated={(t) => (showLink(t), refresh())} />
      </div>
      {link ? (
        <div className="mt-4">
          <Notice tone="ok">
            Invite link (email sending isn't set up yet, so copy and send it yourself):{" "}
            <button
              type="button"
              className="break-all font-mono underline"
              onClick={() => navigator.clipboard?.writeText(link)}
              title="Copy"
            >
              {link}
            </button>
          </Notice>
        </div>
      ) : null}

      <Panel className="mt-8" title="Everyone">
        {q.isPending ? (
          <Loading />
        ) : q.isError ? (
          <Notice tone="error">{errorMessage(q.error)}</Notice>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-3">
              <Field label="Cohort">
                <Select value={cohort} onChange={(e) => setCohort(e.target.value)}>
                  <option value="">All</option>
                  {q.data.cohorts.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Role">
                <Select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="">All</option>
                  {Object.entries(ROLE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Table head={["Person", "Role", "Cohort", "Status", ""]}>
              {q.data.rows
                .filter(
                  (r) =>
                    (!cohort || r.cohort === cohort) &&
                    (!role || (r.roles as string[]).includes(role)),
                )
                .map((r) => (
                  <tr key={`${r.kind}-${r.id}`}>
                    <Td>
                      <span className="font-bold">{r.name}</span>
                      <span className="block text-xs text-ink/60">{r.email}</span>
                    </Td>
                    <Td>{r.roles.map((x) => ROLE_LABEL[x] ?? x).join(", ")}</Td>
                    <Td>{r.cohort ?? "None"}</Td>
                    <Td>
                      <Badge className={STATUS_TONE[r.status] ?? ""}>{r.status}</Badge>
                    </Td>
                    <Td>
                      {r.kind === "invite" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={resend.isPending}
                          onClick={() => resend.mutate(r.id)}
                        >
                          Resend
                        </Button>
                      ) : r.deactivated ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => active.mutate({ userId: r.id, active: true })}
                        >
                          Reactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => active.mutate({ userId: r.id, active: false })}
                        >
                          Deactivate
                        </Button>
                      )}
                    </Td>
                  </tr>
                ))}
            </Table>
            {active.isError ? (
              <div className="mt-3">
                <Notice tone="error">{errorMessage(active.error)}</Notice>
              </div>
            ) : null}
          </>
        )}
      </Panel>
    </>
  );
}

function InviteForm({
  kind,
  onCreated,
}: {
  kind: "artist" | "business_owner" | "curator";
  onCreated: (token: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [extra, setExtra] = useState(kind === "artist" ? "Fremantle 1" : "");
  const m = useMutation({
    mutationFn: () =>
      createInvite({
        data: {
          email,
          role: kind,
          ...(kind === "artist" ? { cohort: extra } : {}),
          ...(kind === "business_owner" ? { businessName: extra } : {}),
        },
      }),
    onSuccess: (r) => {
      setEmail("");
      if (kind === "business_owner") setExtra("");
      onCreated(r.token);
    },
  });
  const title =
    kind === "artist"
      ? "Invite an artist"
      : kind === "business_owner"
        ? "Invite a business"
        : "Invite a curator";
  return (
    <Panel title={title}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
      >
        <Field label="Email">
          <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {kind !== "curator" ? (
          <Field label={kind === "artist" ? "Cohort label" : "Business name"}>
            <Input
              required={kind === "business_owner"}
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
            />
          </Field>
        ) : null}
        {m.isError ? <Notice tone="error">{errorMessage(m.error)}</Notice> : null}
        <Button type="submit" disabled={m.isPending} className="w-full">
          Send invite
        </Button>
      </form>
    </Panel>
  );
}
