import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Library, Search } from "lucide-react";
import { Guard } from "@/components/app/guard";
import { PlayerProvider } from "@/components/listener/player";
import { MiniPlayer, NowPlaying } from "@/components/listener/ui";
import { PackLogo } from "@/components/site/PackLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/listen")({
  ssr: false,
  head: () => ({ meta: [{ title: "The Pack" }, { name: "robots", content: "noindex" }] }),
  component: ListenLayout,
});

const NAV = [
  { to: "/listen", label: "Home", icon: Home, exact: true },
  { to: "/listen/search", label: "Search", icon: Search, exact: false },
  { to: "/listen/library", label: "Library", icon: Library, exact: false },
] as const;

function ListenLayout() {
  return (
    <Guard roles={["listener", "curator"]}>
      {(me) => (
        <PlayerProvider>
          <Shell staff={me.roles.includes("admin") || me.roles.includes("curator")} />
        </PlayerProvider>
      )}
    </Guard>
  );
}

function Shell({ staff }: { staff: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);

  return (
    <>
      <div className="wave-field grad-deep-blue min-h-screen text-paper">
        <header className="mx-auto flex max-w-5xl items-center gap-4 px-4 pt-4 sm:px-6">
          <Link to="/listen" aria-label="The Pack home">
            <PackLogo variant="full" className="h-10 text-yellow" />
          </Link>
          <nav className="ml-4 hidden gap-1 sm:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] ${
                  isActive(n.to, n.exact) ? "bg-yellow text-ink" : "hover:bg-paper/15"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4 font-mono text-xs uppercase tracking-[0.2em]">
            {staff ? (
              <Link to="/admin" className="hover:text-yellow">
                Admin
              </Link>
            ) : null}
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/sign-in" });
              }}
              className="text-paper/80 hover:text-yellow"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-44 pt-6 sm:px-6 sm:pb-32">
          <Outlet />
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40">
        <MiniPlayer />
        <nav className="border-t border-paper/15 bg-ink text-paper sm:hidden" aria-label="Main">
          <div className="grid grid-cols-3">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = isActive(n.to, n.exact);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex flex-col items-center gap-1 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] ${
                    active ? "text-yellow" : "text-paper/75"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      <NowPlaying />
    </>
  );
}
