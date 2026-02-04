import { remarkModifiedTime } from './src/utils/remark-modified-time.mjs';
import { remarkReadingTime } from './src/utils/remark-reading-time.mjs';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import playformCompress from '@playform/compress';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://nabashi-blog.vercel.app',
  integrations: [mdx(), react(), sitemap(), playformCompress()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-high-contrast',
      wrap: true,
    },
    remarkPlugins: [remarkModifiedTime, remarkReadingTime],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
