import { createFileRoute, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { Guard } from "@/components/app/guard";
import { AppShell, Empty, Loading, Select } from "@/components/app/ui";
import { getMyBusiness, type MyBusiness, type MySite } from "@/lib/business.functions";

export const Route = createFileRoute("/business")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Business · The Pack" }, { name: "robots", content: "noindex" }],
  }),
  component: BusinessLayout,
});

const TABS = [
  { to: "/business/player", label: "Player" },
  { to: "/business", label: "My site", exact: true },
  { to: "/business/playlists", label: "Playlists" },
  { to: "/business/plan", label: "My plan" },
];

const SITE_KEY = "pack.business.site";

export function useMyBusiness() {
  return useQuery({ queryKey: ["my-business"], queryFn: () => getMyBusiness() });
}

function readSiteId(): string | null {
  try {
    return window.localStorage.getItem(SITE_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("pack-site-change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("pack-site-change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The site this screen is about. Owners with several sites pick one; the choice is remembered. */
export function useCurrentSite(): {
  business: MyBusiness | undefined;
  site: MySite | undefined;
  setSiteId: (id: string) => void;
  isPending: boolean;
} {
  const query = useMyBusiness();
  const siteId = useSyncExternalStore(subscribe, readSiteId, () => null);
  const sites = query.data?.sites ?? [];
  const site = sites.find((s) => s.id === siteId) ?? sites[0];
  return {
    business: query.data,
    site,
    isPending: query.isPending,
    setSiteId: (id: string) => {
      try {
        window.localStorage.setItem(SITE_KEY, id);
      } catch {
        // storage blocked: nothing to remember the choice in
      }
      window.dispatchEvent(new Event("pack-site-change"));
    },
  };
}

function BusinessLayout() {
  return <Guard roles={["business_owner", "business_staff"]}>{() => <BusinessArea />}</Guard>;
}

function BusinessArea() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { site, business, setSiteId, isPending } = useCurrentSite();
  if (isPending) return <Loading />;
  const onNotice = pathname === "/business/notice";

  // VEN-7, ACC-9: the owner reads the licensing notice before any player goes on air.
  if (site && !site.licensing_accepted_at && !onNotice) return <Navigate to="/business/notice" />;

  // The player is full screen, with no app chrome.
  if (pathname === "/business/player") return <Outlet />;

  return (
    <AppShell
      area="Business"
      areaColor="text-magenta"
      title={site?.businessName ?? ""}
      tabs={onNotice ? [] : TABS}
    >
      {!site ? (
        <Empty title="No site yet">
          Your business hasn't been set up yet. The Pack will add your site for the pilot.
        </Empty>
      ) : (
        <>
          {(business?.sites.length ?? 0) > 1 && !onNotice ? (
            <div className="mb-6 max-w-xs">
              <Select aria-label="Site" value={site.id} onChange={(e) => setSiteId(e.target.value)}>
                {business!.sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          <Outlet />
        </>
      )}
    </AppShell>
  );
}
