import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const site = "https://hanmarket.org";

export default defineConfig({
  site,
  publicDir: path.resolve(import.meta.dirname, "public"),
  integrations: site ? [sitemap()] : [],
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
    },
  },
});
