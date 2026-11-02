import { createFileRoute } from "@tanstack/react-router";

/** Serves an uploaded document (PDF, image) to anyone with the link. */
export const Route = createFileRoute("/api/public/doc/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const raw = (params as { _splat?: string })._splat ?? "";
        const path = decodeURIComponent(raw);

        if (!path || path.includes("..") || !/^[a-zA-Z0-9/._-]+$/.test(path)) {
          return new Response("Not found", { status: 404 });
        }

        const { readStorageObject } = await import("@/lib/admin.server");
        const { data, error } = await readStorageObject(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        const fileName = path.split("/").pop() ?? "document";
        return new Response(data.stream(), {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "content-disposition": `inline; filename="${fileName}"`,
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
