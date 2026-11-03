import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useMe } from "@/components/app/guard";
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
import {
  createInvite,
  listUsers,
  resendInvite,
  setCurator,
  setUserActive,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/users")({ component: Users });

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  curator: "Curator",
  listener: "Listener",
};
const ROLE_TONE: Record<string, string> = {
  admin: "bg-yellow",
  curator: "bg-cyan-200",
  listener: "bg-paper",
};

/** ADM-3: every account in one list. Listeners sign up themselves; admins and curators come by invite. */
function Users() {
  const me = useMe();
  const isAdmin = me.data?.roles.includes("admin");
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listUsers(),
    enabled: !!isAdmin,
  });
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const active = useMutation({
    mutationFn: (v: { userId: string; active: boolean }) => setUserActive({ data: v }),
    onSuccess: refresh,
  });
  const curator = useMutation({
    mutationFn: (v: { userId: string; curator: boolean }) => setCurator({ data: v }),
    onSuccess: refresh,
  });
  const resend = useMutation({
    mutationFn: (inviteId: string) => resendInvite({ data: { inviteId } }),
    onSuccess: (r) => {
      setLink(`${window.location.origin}/invite/${r.token}`);
      refresh();
    },
  });

  if (me.data && !isAdmin) return <Navigate to="/admin/playlists" />;
  if (q.isPending) return <Loading />;
  if (q.isError) return <Notice tone="error">{errorMessage(q.error)}</Notice>;
  const users = q.data.users.filter(
    (u) =>
      (!role || u.roles.includes(role as never)) &&
      (!search || `${u.email} ${u.name ?? ""}`.toLowerCase().includes(search.toLowerCase())),
  );
  const error = active.error ?? curator.error ?? resend.error;

  return (
    <>
      <PageTitle
        kicker="Every change is logged"
        title="Users"
        lead="Listeners create their own accounts. Admins and curators join with an invite link."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Field label="Search">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Email or name"
              />
            </Field>
            <Field label="Role">
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Everyone</option>
                <option value="admin">Admins</option>
                <option value="curator">Curators</option>
                <option value="listener">Listeners</option>
              </Select>
            </Field>
          </div>
          {error ? <Notice tone="error">{errorMessage(error)}</Notice> : null}
          <Table head={["Person", "Roles", "Joined", "Status", ""]}>
            {users.map((u) => (
              <tr key={u.id}>
                <Td>
                  <p className="font-bold">{u.name ?? u.email}</p>
                  {u.name ? <p className="text-xs text-ink/60">{u.email}</p> : null}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} className={ROLE_TONE[r] ?? "bg-paper"}>
                        {ROLE_LABEL[r] ?? r}
                      </Badge>
                    ))}
                  </div>
                </Td>
                <Td>{new Date(u.joinedAt).toLocaleDateString("en-AU")}</Td>
                <Td>
                  {u.deactivated ? (
                    <Badge className="bg-ink text-paper">Deactivated</Badge>
                  ) : (
                    <Badge className="bg-green">Active</Badge>
                  )}
                </Td>
                <Td className="whitespace-nowrap text-right">
                  {u.isMe ? (
                    <span className="text-xs text-ink/50">You</span>
                  ) : (
                    <div className="flex justify-end gap-2">
                      {!u.roles.includes("admin") ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={curator.isPending}
                          onClick={() =>
                            curator.mutate({ userId: u.id, curator: !u.roles.includes("curator") })
                          }
                        >
                          {u.roles.includes("curator") ? "Remove curator" : "Make curator"}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant={u.deactivated ? "green" : "danger"}
                        disabled={active.isPending}
                        onClick={() => active.mutate({ userId: u.id, active: u.deactivated })}
                      >
                        {u.deactivated ? "Reactivate" : "Deactivate"}
                      </Button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
          {q.data.invites.length ? (
            <Panel title="Waiting to join" kicker="Invite links not used yet">
              <ul className="divide-y divide-ink/15 text-sm">
                {q.data.invites.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>
                      <span className="font-bold">{i.email}</span> · {ROLE_LABEL[i.role] ?? i.role}
                      {i.expired ? <span className="text-ember"> · expired</span> : null}
                    </span>
                    <div className="flex gap-2">
                      {!i.expired ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setLink(`${window.location.origin}/invite/${i.token}`)}
                        >
                          Show link
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={resend.isPending}
                        onClick={() => resend.mutate(i.id)}
                      >
                        New link
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
        <div className="space-y-6">
          <InviteForm
            onCreated={(token) => {
              setLink(`${window.location.origin}/invite/${token}`);
              refresh();
            }}
          />
          {link ? (
            <Panel title="Invite link" kicker="Single use, expires in 14 days">
              <p className="text-sm">
                Email isn't wired up yet, so copy this link and send it yourself.
              </p>
              <Input
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="mt-3 font-mono text-xs"
              />
              <Button
                size="sm"
                className="mt-3"
                onClick={() => navigator.clipboard?.writeText(link)}
              >
                Copy link
              </Button>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}

function InviteForm({ onCreated }: { onCreated: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "curator">("curator");
  const create = useMutation({
    mutationFn: () => createInvite({ data: { email, role } }),
    onSuccess: (r) => {
      setEmail("");
      onCreated(r.token);
    },
  });
  return (
    <Panel title="Invite someone">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Field label="Email">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field
          label="Role"
          hint="Curators build playlists and tag music. Admins can do everything."
        >
          <Select value={role} onChange={(e) => setRole(e.target.value as "admin" | "curator")}>
            <option value="curator">Curator</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
        {create.isError ? <Notice tone="error">{errorMessage(create.error)}</Notice> : null}
        <Button type="submit" className="w-full" disabled={create.isPending}>
          Make invite link
        </Button>
      </form>
    </Panel>
  );
}
