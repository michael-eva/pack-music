import type { SupabaseClient } from "@supabase/supabase-js";

/** Server-only helpers for the admin area. Never imported by browser code. */

export async function isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return false;
  return !!data;
}

/** Grants admin to the given user only while no admin exists yet. */
export async function claimFirstAdminFor(userId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("claim_first_admin" as never, {
    _user_id: userId,
  } as never);
  if (error) throw new Error(error.message);
  return data === true;
}

export async function assertAdmin(supabase: SupabaseClient, userId: string): Promise<void> {
  if (!(await isAdmin(supabase, userId))) {
    throw new Response("Forbidden", { status: 403 });
  }
}

export async function anyAdminExists(): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return (count ?? 0) > 0;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
}

export async function createSignedUpload(input: { fileName: string; contentType: string }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const path = `library/${Date.now()}-${safeName(input.fileName)}`;
  const { data, error } = await supabaseAdmin.storage.from("documents").createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? "Could not start the upload");
  return { path, signedUrl: data.signedUrl, token: data.token };
}

export async function removeStorageObject(path: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.storage.from("documents").remove([path]);
}

/** Streams a stored document to the public, without exposing the bucket. */
export async function readStorageObject(path: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin.storage.from("documents").download(path);
}
