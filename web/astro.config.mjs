// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';

// NOTE for backend owner (Kiro): `site` is used for sitemap + canonical/OG URLs.
// Update this to the real production origin before deploying.
const SITE = process.env.PUBLIC_SITE_URL ?? 'https://clarityscale.example.com';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  // SSR enabled so the contact server endpoint can exist. Individual pages
  // opt back into static pre-rendering via `export const prerender = true`
  // (see src/pages/index.astro), keeping marketing markup static at build time.
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [preact(), sitemap()],
  vite: {
    build: {
      // GSAP ships fine as an ES module; keep it in its own chunk so the
      // animation island can be deferred without bloating the form island.
      cssCodeSplit: true,
    },
  },
});
