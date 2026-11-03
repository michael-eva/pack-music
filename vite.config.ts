import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    // src/server.ts wraps the SSR entry with a friendly error page.
    tanstackStart({ server: { entry: "server" } }),
    nitro({
      // Bundle the static ffmpeg binary so the server can measure uploaded audio.
      traceDeps: ["ffmpeg-static*"],
      // On Vercel, run server functions in Sydney, next to the database.
      vercel: { functions: { regions: ["syd1"], maxDuration: 60 } },
    }),
    viteReact(),
  ],
});
