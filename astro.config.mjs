import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://nabashi-blog.vercel.app",
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react(), mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: "github-dark-high-contrast",
      wrap: true,
    },
  },
});
