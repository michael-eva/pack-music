import { Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getMe, type Me } from "@/lib/session.functions";
import { supabase } from "@/integrations/supabase/client";
import { Empty, Loading } from "./ui";
import type { AppRole } from "@/lib/auth.server";

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => getMe(), retry: false, staleTime: 30_000 });
}

/** Used as `beforeLoad` on signed-in areas. Client-only routes (ssr: false). */
export async function requireSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Gate for a signed-in area: right role, then the onboarding steps in order
 * (accept the current Terms) before any of the area's screens (ACC-7).
 */
export function Guard({ roles, children }: { roles: AppRole[]; children: (me: Me) => ReactNode }) {
  const me = useMe();
  if (me.isPending) return <Loading />;
  if (me.isError) return <Navigate to="/sign-in" />;
  const data = me.data;
  const allowed = data.roles.includes("admin") || roles.some((r) => data.roles.includes(r));
  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg py-20">
        <Empty title="Not your door">This part of The Pack is for another kind of account.</Empty>
      </div>
    );
  }
  if (!data.roles.includes("admin")) {
    if (!data.termsAccepted) return <Navigate to="/welcome" />;
  }
  return <>{children(data)}</>;
}
