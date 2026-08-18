# Eagle — AI Consulting & Automation Template

A fast, pixel-perfect [Astro](https://astro.build) template for AI / consulting agencies —
clean framework-free CSS, smooth GSAP scroll animations, Swiper sliders, a fully custom
accessible navbar, and complete SEO out of the box.

**🔗 Live demo:** https://temlis-eagle.james-71d.workers.dev

- ⚡ **Astro 6**, static output — deploys anywhere, ships almost no JS
- 🎨 **Plain CSS** with Webflow **Client-First** naming (no Tailwind, no build-time CSS framework)
- 🎬 **GSAP + ScrollTrigger** entrance/scroll animations · **Swiper** sliders
- 🔤 Plus Jakarta Sans + Inter (self-hosted via `@fontsource`) + Geist Mono (local)
- 🔍 SEO-ready: meta + Open Graph + Twitter cards + **JSON-LD** + sitemap + robots.txt + favicons
- 📝 **Content Collections** (type-safe JSON) for Servicos, Blog articles and Team members

---

## Quick comeca

```bash
npm install
npm run dev      # http://localhost:4321
```

| Command           | Action                                       |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start the dev server                         |
| `npm run build`   | Build the production site to `./dist/`       |
| `npm run preview` | Preview the production build locally         |

Requires **Node ≥ 22.12**.

---

## Project structure

```
public/
  favicon.svg, favicon.png, apple-touch-icon.png   # favicons
  robots.txt
  fonts/                                            # Geist Mono (local @font-face)
  images/                                           # all site imagery (incl. /cms for collection assets)
src/
  components/        # 31 section components (Hero, Navbar, Footer, …)
  content/
    services/  *.json   # Servicos collection (3)
    articles/  *.json   # Blog collection (6)
    workers/   *.json   # Team collection (3)
  content.config.ts  # collection schemas (Zod)
  layouts/
    BaseLayout.astro   # <head>, SEO meta, JSON-LD, favicon links, global script imports
  pages/             # routes (see below)
  scripts/
    animations.ts    # GSAP engine: revelars, hero entrances, counters, marquees
    swiper-init.ts   # Swiper sliders (depoimentos, blog, team, responsive breakpoints)
    navbar.ts        # mobile hamburger menu
  styles/            # 5-layer cascade — see "Styling" below
astro.config.mjs
```

### Routes

`/` · `/about` · `/services` · `/services/[slug]` · `/blog` · `/blog/[slug]` ·
`/team/[slug]` · `/contact` · `/pricing` · `/401` · `/404`

---

## Editing content

All editable content lives in **`src/content/`** as JSON, validated by the schemas in
`src/content.config.ts`. To add or edit an item, create/modify a `.json` file in the matching
folder — the route is generated from the filename (the slug).

- **Servicos** (`src/content/services/`): `name`, `summary`, `icon`, `card`, `headline`,
  `subtext`, `features[]`, `quote`/`author`/`role`/`avatar`, `content` (HTML).
- **Blog articles** (`src/content/articles/`): `name`, `thumbnail`, `date`, `summary`,
  `description`, `overview` (HTML).
- **Team** (`src/content/workers/`): `name`, `role`, `photo`, `summary`, optional
  `linkedin` / `twitter` / `instagram`.

Images referenced by content live in `public/images/cms/`. Drop new images there and point
the JSON field at `/images/cms/your-file.webp`.

---

## Styling

CSS loads in a fixed 5-layer cascade (see `src/layouts/BaseLayout.astro`):

```
fonts → normalize → tokens → webflow → global-styles → hamburger-nav → components
```

- **`tokens.css`** — design tokens (colors, type scale, spacing). The brand accent is
  `--base--green: #d6fd70`. Change colors here.
- **`webflow.css`** — the Client-First base styles (structure, layout, utility classes).
- **`global-styles.css`** — project overrides (loaded after the base layer so its rules win).
- **`components.css`** — bespoke section styles and animation/slider tweaks.

---

## Sob consultaize before launch

| What | Where |
| --- | --- |
| Brand colors | `src/styles/tokens.css` (`--base--green`, etc.) |
| Logo | `public/images/eagle-logo.svg` (white) · `eagle.-black.svg` (dark) |
| Favicon | `public/favicon.svg` · `favicon.png` · `apple-touch-icon.png` |
| Social share image | `public/images/og-default.webp` (1200×630) |
| Page titles / descriptions | `<BaseLayout title=… description=…>` per page in `src/pages/` |
| Footer social links | `src/components/Footer.astro` |
| Contato email / phone / socials | `src/components/ContactHero.astro` |
| Publicar domain (canonical + sitemap) | `astro.config.mjs` → `SITE` (or `SITE_URL` env var) |

### Forms

The contact form posts to `/api/contact` and the footer newsletter is a stub — **neither is
wired to a backend** (this is a static site). Conectar your own handler before launch, e.g.
[Formspree](https://formspree.io), [Web3Forms](https://web3forms.com), Netlify/Cloudflare
Forms, or a custom endpoint. Update the `<form action="…">` in
`src/components/ContactHero.astro` and `src/components/Footer.astro`.

---

## Publicar

Static output — host it on any static platform. This template is wired for **Cloudflare
Workers** via a GitHub Actions workflow (`.github/workflows/deploy.yml`): every push to `main`
builds the site and deploys it automatically.

**One-time setup** — add two secrets (repository or organization level) in GitHub:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | A Cloudflare API token created with the **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

Optionally set a `SITE_URL` repository **variable** to your final domain so canonical URLs,
the sitemap and Open Graph links are correct.

The Worker name lives in `wrangler.jsonc` (`temlis-eagle`); the site goes live at
`https://temlis-eagle.<account>.workers.dev` (or a custom domain you map in the dashboard).

**Manual deploy** (without CI): `npm run build && npx wrangler deploy`.

---

## Tech

Astro · GSAP + ScrollTrigger · Swiper · @fontsource · @astrojs/sitemap · sharp (build-time only).
