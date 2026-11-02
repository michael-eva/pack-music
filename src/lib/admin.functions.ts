import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Admin-only content management. Every handler re-checks the admin role. */

const postSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Web address can use lowercase letters, numbers and dashes only"),
  title: z.string().trim().min(1).max(300),
  published_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  author: z.string().trim().max(160),
  excerpt: z.string().trim().max(1000),
  body: z.string().max(200000),
  cover_image: z.string().trim().max(1000).nullable().default(null),
  is_published: z.boolean(),
});

const librarySchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(["paper", "policy", "faq"]),
  title: z.string().trim().min(1).max(500),
  label: z.string().trim().max(160),
  body: z.string().max(20000),
  href: z.string().trim().max(1000).nullable(),
  sort_order: z.number().int().min(0).max(9999),
  is_published: z.boolean(),
});

const boardSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  role: z.string().trim().max(200),
  blurb: z.string().trim().max(500),
  bio: z.string().max(10000),
  photo_url: z.string().trim().max(1000).nullable(),
  sort_order: z.number().int().min(0).max(9999),
  is_published: z.boolean(),
});

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { isAdmin, anyAdminExists } = await import("./admin.server");
    return {
      userId: context.userId,
      isAdmin: await isAdmin(context.supabase, context.userId),
      anyAdminExists: await anyAdminExists(),
    };
  });

export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { claimFirstAdminFor } = await import("./admin.server");
    return { claimed: await claimFirstAdminFor(context.userId) };
  });

export const listAllContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase;
    const [posts, library, board, uploads] = await Promise.all([
      sb.from("posts").select("*").order("published_on", { ascending: false }),
      sb.from("library_items").select("*").order("kind").order("sort_order"),
      sb.from("board_members").select("*").order("sort_order"),
      sb.from("uploads").select("*").order("created_at", { ascending: false }),
    ]);
    return {
      posts: posts.data ?? [],
      library: library.data ?? [],
      board: board.data ?? [],
      uploads: uploads.data ?? [],
    };
  });

export const listEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ source: z.enum(["signups", "contact_messages"]), page: z.number().int().min(0) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    const start = data.page * 50;
    if (data.source === "signups") {
      const result = await context.supabase.from("signups")
        .select("id,name,email,role,location,message,created_at", { count: "exact" })
        .order("created_at", { ascending: false }).order("id").range(start, start + 49);
      if (result.error) throw new Error("Could not load membership signups. Please try again.");
      return { rows: result.data ?? [], total: result.count ?? 0 };
    }
    const result = await context.supabase.from("contact_messages")
      .select("id,name,email,message,created_at", { count: "exact" })
      .order("created_at", { ascending: false }).order("id").range(start, start + 49);
    if (result.error) throw new Error("Could not load contact messages. Please try again.");
    return { rows: (result.data ?? []).map((row) => ({ ...row, role: null, location: null })), total: result.count ?? 0 };
  });

export const savePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => postSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { id, ...fields } = data;
    const query = id
      ? context.supabase.from("posts").update(fields).eq("id", id)
      : context.supabase.from("posts").insert(fields);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const saveLibraryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => librarySchema.parse(data))
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { id, ...fields } = data;
    const query = id
      ? context.supabase.from("library_items").update(fields).eq("id", id)
      : context.supabase.from("library_items").insert(fields);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const saveBoardMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => boardSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { id, ...fields } = data;
    const query = id
      ? context.supabase.from("board_members").update(fields).eq("id", id)
      : context.supabase.from("board_members").insert(fields);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const siteTextSchema = z.object({
  entries: z
    .array(z.object({ key: z.string().trim().min(1).max(200), value: z.string().max(20000) }))
    .max(400),
});

export const listSiteText = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase.from("site_text").select("key,value");
    if (error) throw new Error(error.message);
    return { entries: data ?? [] };
  });

/** Saves page copy overrides. An empty value restores the built-in text. */
export const saveSiteText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => siteTextSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    const changed = data.entries.filter((e) => e.value.trim().length > 0);
    const cleared = data.entries.filter((e) => e.value.trim().length === 0).map((e) => e.key);
    if (changed.length) {
      const { error } = await context.supabase
        .from("site_text")
        .upsert(changed.map((e) => ({ key: e.key, value: e.value })), { onConflict: "key" });
      if (error) throw new Error(error.message);
    }
    if (cleared.length) {
      const { error } = await context.supabase.from("site_text").delete().in("key", cleared);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const deleteRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        table: z.enum(["posts", "library_items", "board_members"]),
        id: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const createUploadTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        fileName: z.string().trim().min(1).max(200),
        label: z.string().trim().max(300),
        contentType: z.string().trim().max(200),
        size: z.number().int().min(1).max(60_000_000),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin, createSignedUpload } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    return createSignedUpload(data);
  });

export const confirmUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        label: z.string().trim().max(300),
        fileName: z.string().trim().min(1).max(200),
        path: z.string().trim().min(1).max(400),
        contentType: z.string().trim().max(200),
        size: z.number().int().min(0),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    const publicUrl = `/api/public/doc/${data.path}`;
    const { error } = await context.supabase.from("uploads").insert({
      label: data.label || data.fileName,
      file_name: data.fileName,
      storage_path: data.path,
      public_url: publicUrl,
      content_type: data.contentType,
      size_bytes: data.size,
    });
    if (error) throw new Error(error.message);
    return { publicUrl };
  });

export const deleteUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { assertAdmin, removeStorageObject } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { data: row } = await context.supabase
      .from("uploads")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.storage_path) await removeStorageObject(row.storage_path);
    const { error } = await context.supabase.from("uploads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
