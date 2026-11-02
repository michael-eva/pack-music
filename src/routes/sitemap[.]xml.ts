import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

const PATHS = [
  "/",
  "/about",
  "/story",
  "/coop-model",
  "/board",
  "/artists",
  "/listeners",
  "/partners",
  "/blog",
  "/governance",
  "/papers",
  "/policies",
  "/faqs",
  "/join",
  "/support",
  "/ambassador",
  "/patron",
  "/contact",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { publicClient } = await import("@/lib/content.server");
        const { data: posts } = await publicClient()
          .from("posts")
          .select("slug")
          .eq("is_published", true);
        const paths = [...PATHS, ...(posts ?? []).map((p: { slug: string }) => `/blog/${p.slug}`)];
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...paths.map(
            (p) =>
              `  <url>\n    <loc>${BASE_URL}${p}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${p === "/" ? "1.0" : "0.8"}</priority>\n  </url>`,
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
