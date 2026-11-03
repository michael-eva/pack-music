import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Who am I, what can I do, and have I accepted the current Terms (ACC-7). */
export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db, getCaller } = await import("./auth.server");
    const sb = await db();
    await ensureProfile(context.userId, String(context.claims.email ?? ""));
    const caller = await getCaller(context.userId);

    const [{ data: docs }, { data: accepted }] = await Promise.all([
      sb.from("documents").select("id,kind,version,title,body,href").eq("is_current", true),
      sb.from("acceptances").select("document_id").eq("user_id", context.userId),
    ]);
    const acceptedIds = new Set((accepted ?? []).map((a) => a.document_id));

    return {
      ...caller,
      termsAccepted: (docs ?? []).every((d) => acceptedIds.has(d.id)),
      documents: docs ?? [],
    };
  });

export type Me = Awaited<ReturnType<typeof getMe>>;

async function ensureProfile(userId: string, email: string) {
  const { db } = await import("./auth.server");
  const sb = await db();
  const { data } = await sb.from("profiles").select("user_id").eq("user_id", userId).maybeSingle();
  if (data) return;
  await sb.from("profiles").insert({ user_id: userId, email: email.toLowerCase() });
  // Anyone can sign up as a listener. Admin and curator come only from an invite.
  await sb
    .from("user_roles")
    .upsert({ user_id: userId, role: "listener" }, { onConflict: "user_id,role" });
}

/** Public: what an invite link is for, so the join screen can say so. */
export const getInvite = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ token: z.string().min(10).max(100) }).parse(data))
  .handler(async ({ data }) => {
    const { db } = await import("./auth.server");
    const sb = await db();
    const { data: invite } = await sb
      .from("invites")
      .select("email,role,expires_at,used_at")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite) return { status: "missing" as const };
    if (invite.used_at) return { status: "used" as const };
    if (new Date(invite.expires_at) < new Date()) return { status: "expired" as const };
    return { status: "ok" as const, email: invite.email, role: invite.role };
  });

/** Redeems a single-use invite for the signed-in account. */
export const redeemInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        token: z.string().min(10).max(100),
        displayName: z.string().trim().max(120).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { db, audit } = await import("./auth.server");
    const sb = await db();
    await ensureProfile(context.userId, String(context.claims.email ?? ""));
    const { data: invite } = await sb
      .from("invites")
      .select("*")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite || invite.used_at || new Date(invite.expires_at) < new Date()) {
      throw new Error(
        "This invite link has already been used or has expired. Ask The Pack for a new one.",
      );
    }
    const email = String(context.claims.email ?? "").toLowerCase();
    if (invite.email.toLowerCase() !== email) {
      throw new Error(
        `This invite was sent to ${invite.email}. Sign in with that address to use it.`,
      );
    }

    // Mark used first, guarded on used_at, so a link can never be redeemed twice.
    const { data: claimed } = await sb
      .from("invites")
      .update({ used_at: new Date().toISOString(), used_by: context.userId })
      .eq("id", invite.id)
      .is("used_at", null)
      .select("id");
    if (!claimed?.length) throw new Error("This invite link has already been used.");

    await sb
      .from("user_roles")
      .upsert({ user_id: context.userId, role: invite.role }, { onConflict: "user_id,role" });
    if (data.displayName) {
      await sb
        .from("profiles")
        .update({ display_name: data.displayName })
        .eq("user_id", context.userId);
    }
    await audit({
      actor: context.userId,
      action: "invite.redeem",
      target: invite.id,
      after: { role: invite.role },
    });
    return { role: invite.role };
  });

/** Records acceptance of the current Terms and Privacy Policy (ACC-7). */
export const acceptTerms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ newsOptIn: z.boolean().default(false) }).parse(data))
  .handler(async ({ context, data }) => {
    const { db, audit } = await import("./auth.server");
    const sb = await db();
    await ensureProfile(context.userId, String(context.claims.email ?? ""));
    const { data: docs } = await sb
      .from("documents")
      .select("id,kind,version")
      .eq("is_current", true);
    if (!docs?.length) throw new Error("No current documents to accept.");
    await sb.from("acceptances").upsert(
      docs.map((d) => ({ user_id: context.userId, document_id: d.id })),
      { onConflict: "user_id,document_id", ignoreDuplicates: true },
    );
    await sb.from("profiles").update({ news_opt_in: data.newsOptIn }).eq("user_id", context.userId);
    await audit({
      actor: context.userId,
      action: "documents.accept",
      after: docs.map((d) => `${d.kind}@${d.version}`),
    });
    return { ok: true as const };
  });
