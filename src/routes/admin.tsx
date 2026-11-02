import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Guard } from "@/components/app/guard";
import { AppShell, type Tab } from "@/components/app/ui";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin · The Pack" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const ADMIN_TABS: Tab[] = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/review", label: "Review queue" },
  { to: "/admin/playlists", label: "Playlists" },
  { to: "/admin/sites", label: "Sites" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/ledger", label: "Ledger" },
  { to: "/admin/policy", label: "Policy" },
  { to: "/admin/audit", label: "Audit log" },
];

// A curator can preview and build, and see the queue, but not approve (D intro).
const CURATOR_TABS: Tab[] = [
  { to: "/admin/playlists", label: "Playlists" },
  { to: "/admin/review", label: "Review queue" },
];

function AdminLayout() {
  return (
    <Guard roles={["admin", "curator"]}>
      {(me) => {
        const isAdmin = me.roles.includes("admin");
        return (
          <AppShell
            wide
            area={isAdmin ? "Admin" : "Curator"}
            areaColor="text-yellow"
            title={me.displayName ?? me.email}
            tabs={isAdmin ? ADMIN_TABS : CURATOR_TABS}
          >
            <Outlet />
          </AppShell>
        );
      }}
    </Guard>
  );
}
