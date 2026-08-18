// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// URL pública do site. É ela que gera as URLs canônicas, o sitemap e os links
// de Open Graph, então precisa ser o domínio final.
//
// IMPORTANTE: assim que o domínio próprio existir, defina a variável de
// ambiente SITE_URL na Vercel (Settings > Environment Variables). Sem isso o
// sitemap e as canônicas continuam apontando para o domínio provisório, e o
// Google indexa o endereço errado.
const SITE = process.env.SITE_URL || 'https://novusailp.vercel.app';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  output: 'static',
  compressHTML: true,
  integrations: [
    sitemap({
      // Keep noindex pages (401/404) out of the sitemap.
      filter: (page) => !/\/(401|404)\/?$/.test(page),
    }),
  ],
});
