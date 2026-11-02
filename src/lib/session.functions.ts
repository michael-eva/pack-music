import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Who am I, what can I do, and what must I accept first (ACC-7 to ACC-9). */
export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db, getCaller, getSettings } = await import("./auth.server");
    const sb = await db();
    await ensureProfile(context.userId, String(context.claims.email ?? ""));
    const caller = await getCaller(context.userId);

    const [
      { data: docs },
      { data: accepted },
      { data: membership },
      { data: artist },
      { data: owned },
      { data: staffOf },
    ] = await Promise.all([
      sb.from("documents").select("id,kind,version,title,summary,body,href").eq("is_current", true),
      sb.from("acceptances").select("document_id").eq("user_id", context.userId),
      sb
        .from("memberships")
        .select("class,accepted_at,rules_document_id")
        .eq("user_id", context.userId)
        .order("accepted_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      sb
        .from("artists")
        .select("id,public_name,region,bio")
        .eq("user_id", context.userId)
        .maybeSingle(),
      sb
        .from("businesses")
        .select("id,name,sites(id,name,short_code,licensing_accepted_at)")
        .eq("owner_user_id", context.userId),
      sb
        .from("site_staff")
        .select("site_id,sites(id,name,short_code,business_id)")
        .eq("user_id", context.userId),
    ]);

    const acceptedIds = new Set((accepted ?? []).map((a) => a.document_id));
    const current = (kind: string) => (docs ?? []).find((d) => d.kind === kind);
    const hasAccepted = (kind: string) => {
      const doc = current(kind);
      return !doc || acceptedIds.has(doc.id);
    };
    const rules = current("coop_rules");
    const needsMembership = caller.roles.some((r) => r === "artist" || r === "business_owner");
    const settings = await getSettings();

    return {
      ...caller,
      testMode: settings.testMode,
      termsAccepted: hasAccepted("terms") && hasAccepted("privacy"),
      membership: membership
        ? {
            class: membership.class,
            acceptedAt: membership.accepted_at,
            current: membership.rules_document_id === rules?.id,
          }
        : null,
      needsMembership,
      artist: artist ?? null,
      artistAgreementAccepted: hasAccepted("artist_agreement"),
      businesses: owned ?? [],
      staffSites: (staffOf ?? []).map((s) => s.sites).filter(Boolean),
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
  // Everyone who signs in can save songs. Other roles come only from an invite (ACC-3).
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
      .select("email,role,cohort,expires_at,used_at,businesses(name)")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite) return { status: "missing" as const };
    if (invite.used_at) return { status: "used" as const };
    if (new Date(invite.expires_at) < new Date()) return { status: "expired" as const };
    return {
      status: "ok" as const,
      email: invite.email,
      role: invite.role,
      cohort: invite.cohort,
      businessName: invite.businesses?.name ?? null,
    };
  });

/** Redeems a single-use invite for the signed-in account (ACC-3, ACC-4). */
export const redeemInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        token: z.string().min(10).max(100),
        publicName: z.string().trim().max(120).optional(),
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

    if (invite.role === "artist") {
      const { data: existing } = await sb
        .from("artists")
        .select("id")
        .eq("user_id", context.userId)
        .maybeSingle();
      if (!existing) {
        const name = data.publicName || email.split("@")[0]!;
        const { data: person } = await sb
          .from("people")
          .insert({ name, email, user_id: context.userId })
          .select("id")
          .single();
        await sb
          .from("artists")
          .insert({ user_id: context.userId, public_name: name, cohort: invite.cohort });
        // PAY-8: attach any unclaimed balance already held for this email.
        await sb
          .from("people")
          .update({ user_id: context.userId })
          .eq("email", email)
          .is("user_id", null)
          .neq("id", person!.id);
      }
    }
    if (invite.role === "business_owner" && invite.business_id) {
      await sb
        .from("businesses")
        .update({ owner_user_id: context.userId })
        .eq("id", invite.business_id);
    }
    if (invite.role === "business_staff" && invite.site_id) {
      await sb.from("site_staff").upsert({
        site_id: invite.site_id,
        user_id: context.userId,
        display_name: data.publicName ?? "",
      });
    }
    await audit({
      actor: context.userId,
      action: "invite.redeem",
      target: invite.id,
      after: { role: invite.role },
    });
    return { role: invite.role };
  });

/** Records acceptance of the current version of each named document (ACC-7, ART-3). */
export const acceptDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        kinds: z.array(z.enum(["terms", "privacy", "artist_agreement", "licensing_notice"])).min(1),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { db, audit } = await import("./auth.server");
    const sb = await db();
    const { data: docs } = await sb
      .from("documents")
      .select("id,kind,version")
      .eq("is_current", true)
      .in("kind", data.kinds);
    if (!docs?.length) throw new Error("No current documents to accept.");
    await sb.from("acceptances").upsert(
      docs.map((d) => ({ user_id: context.userId, document_id: d.id })),
      { onConflict: "user_id,document_id", ignoreDuplicates: true },
    );
    await audit({
      actor: context.userId,
      action: "documents.accept",
      after: docs.map((d) => `${d.kind}@${d.version}`),
    });
    return { ok: true as const };
  });

/** Joining the co-op is its own step (ACC-8). Open data consent is separate and optional (ACC-10). */
export const joinCoop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ openData: z.boolean() }).parse(data))
  .handler(async ({ context, data }) => {
    const { db, getCaller, audit } = await import("./auth.server");
    const sb = await db();
    const caller = await getCaller(context.userId);
    const { data: rules } = await sb
      .from("documents")
      .select("id,version")
      .eq("kind", "coop_rules")
      .eq("is_current", true)
      .single();
    const memberClass = caller.roles.includes("artist") ? "full" : "associate";
    await sb
      .from("memberships")
      .insert({ user_id: context.userId, class: memberClass, rules_document_id: rules!.id });
    await sb
      .from("acceptances")
      .upsert(
        { user_id: context.userId, document_id: rules!.id },
        { onConflict: "user_id,document_id", ignoreDuplicates: true },
      );
    if (data.openData) {
      await sb
        .from("profiles")
        .update({ open_data_consent_at: new Date().toISOString() })
        .eq("user_id", context.userId);
    }
    await audit({
      actor: context.userId,
      action: "membership.join",
      after: { class: memberClass, rules: rules!.version, openData: data.openData },
    });
    return { class: memberClass };
  });
