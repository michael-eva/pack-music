import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { BoardRecord, LibraryRecord, PostRecord } from "./content-format";

/** Public, read-only content reads. Safe for SSR and prerender (no session needed). */

export const listPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./content.server");
  const { data, error } = await publicClient()
    .from("posts")
    .select("slug,title,published_on,author,excerpt,body,cover_image")
    .eq("is_published", true)
    .order("published_on", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PostRecord[];
});

export const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().max(200) }).parse(data))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./content.server");
    const { data: row, error } = await publicClient()
      .from("posts")
      .select("slug,title,published_on,author,excerpt,body,cover_image")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as PostRecord | null;
  });

export const listLibrary = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ kind: z.enum(["paper", "policy", "faq"]) }).parse(data))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./content.server");
    const { data: rows, error } = await publicClient()
      .from("library_items")
      .select("id,kind,title,label,body,href,sort_order")
      .eq("is_published", true)
      .eq("kind", data.kind)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as LibraryRecord[];
  });

export const listBoard = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./content.server");
  const { data, error } = await publicClient()
    .from("board_members")
    .select("id,name,role,blurb,bio,photo_url,photo_position")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BoardRecord[];
});
