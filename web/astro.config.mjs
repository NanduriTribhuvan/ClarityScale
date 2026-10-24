// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';

// Vercel sets VERCEL=1 during its builds. There we use the Vercel adapter
// (the contact API becomes a serverless function); everywhere else we keep
// the standalone Node server.
const onVercel = Boolean(process.env.VERCEL);

// `site` is used for sitemap + canonical/OG URLs. Set PUBLIC_SITE_URL to the
// real domain; on Vercel it falls back to the project's production URL.
const SITE =
  process.env.PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://clarityscale.example.com');

// https://astro.build/config
export default defineConfig({
  site: SITE,
  // SSR enabled so the contact server endpoint can exist. Individual pages
  // opt back into static pre-rendering via `export const prerender = true`
  // (see src/pages/index.astro), keeping marketing markup static at build time.
  output: 'server',
  adapter: onVercel ? vercel() : node({ mode: 'standalone' }),
  integrations: [preact(), sitemap()],
  vite: {
    build: {
      cssCodeSplit: true,
    },
  },
});
