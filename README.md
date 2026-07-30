# Parsy

> A modern, high-performance, **local-first** JSON developer toolkit.

Format, minify, and validate JSON instantly — entirely in your browser. Your
data never leaves your device.

Built with **Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Monaco
Editor**, organized as a **pnpm + Turborepo monorepo**.

---

## ✨ Features (Sprint 1)

This release delivers the three core JSON tools, each on its own SEO-friendly
route:

| Tool | Route | What it does |
| :--- | :--- | :--- |
| ✨ **JSON Formatter** | `/json-formatter` | Beautify JSON with 2-space / 4-space / tab indentation |
| ✔️ **JSON Validator** | `/json-validator` | Syntax check with precise **line & column** reporting |
| 🗜️ **JSON Minifier** | `/json-minifier` | Compress JSON to a single line, shrink payload size |

All three share one editor component and add:

- **Monaco Editor** input + output panes with syntax highlighting
- **Web Worker** processing — the UI stays responsive even on multi-MB JSON
- **Main-thread fallback** — if a Worker can't be created, it still works
- **Copy / Download / Clear / Load sample** actions
- **Live validation** with the offending line highlighted in the gutter
- **Dark / light theme** with system preference
- **Privacy by design** — no uploads, no telemetry; only UI preferences are
  persisted locally (never your JSON)

### Planned (later sprints)

JSON Tree Viewer · JSON Diff · JSON Repair · JSONPath · JSON Schema ·
JSON → Code (Java/Kotlin/Swift/TypeScript/Go/Rust/C#/ Dart) · and more.

---

## 🏗️ Architecture

```
Browser
  └── Next.js App (apps/web)
        ├── Monaco Editor (client-only, code-split)
        ├── JSON Engine   ← @parsy/json-core (pure functions)
        ├── Web Worker    ← offloads parse/stringify from the UI thread
        └── UI primitives ← shadcn-style components + Tailwind v4
```

**Design principles**

- **Local First** — all processing happens in the browser.
- **Data never uploaded** — there is no backend that stores user JSON.
- **Fast on big JSON** — heavy work runs in a Web Worker with graceful fallback.

### Monorepo layout

```
parsy/
├── apps/
│   └── web/                      # Next.js 15 application
│       ├── app/                  # routes: /, /json-formatter, …
│       ├── components/           # ui (shadcn), layout, editor, formatter
│       ├── hooks/                # use-json-worker, use-copy
│       ├── workers/              # json.worker.ts
│       ├── store/                # zustand (preferences only)
│       └── lib/                  # utils, sample JSON
└── packages/
    ├── json-core/                # framework-agnostic JSON primitives ⭐
    ├── ui/                       # shared design tokens + tool registry
    └── converter/                # JSON→code (Sprint 4 scaffold)
```

Internal packages ship **raw TypeScript** and are transpiled on the fly by
Next.js (`transpilePackages`) — no per-package build step needed.

---

## 🚀 Getting started

### Prerequisites

- **Node.js ≥ 20** (built and tested on Node 22)
- **pnpm ≥ 9** (`npm i -g pnpm` if you don't have it)

### Install & run

```bash
pnpm install
pnpm dev
```

Then open **http://localhost:3000**.

### Other scripts

```bash
pnpm build        # production build (all packages, via Turborepo)
pnpm start        # serve the production build
pnpm typecheck    # tsc --noEmit across the workspace
pnpm lint         # next lint
pnpm clean        # remove build artifacts + node_modules
```

---

## 🌍 Internationalization (i18n)

The app is fully localized for **中文 (`zh`, default)** and **English (`en`)**,
powered by [`next-intl`](https://next-intl.dev/) with locale-prefixed routing.

- **URLs**: `/zh/...` and `/en/...`. The bare root `/` 307-redirects to `/zh`.
- **Switch language**: the globe icon in the header — it preserves the current
  path and updates the URL.
- **SEO**: every route is prerendered for both locales; `sitemap.xml` emits one
  entry per (locale × route) with `hreflang` alternates; `<html lang>` and all
  metadata are localized.

### Adding a language

1. Add the code to `locales` in `apps/web/i18n/routing.ts`.
2. Create `apps/web/messages/<code>.json` (copy `zh.json` as a template).
3. (Optional) Add the locale label to the switcher in
   `apps/web/components/language-toggle.tsx`.

That's it — routing, sitemap, and metadata pick it up automatically.

### How strings are organized

- All UI text lives in `apps/web/messages/{zh,en}.json`, organized by namespace
  (`site`, `nav`, `tools`, `home`, `tool`, `errors`, `metadata`, …).
- Components read strings via `useTranslations("<namespace>")` (client) or
  `getTranslations(...)` (server).
- **Error messages from `@parsy/json-core`** (which runs in a Web
  Worker) are returned as **stable codes** (e.g. `"unexpected_token"`), then
  mapped to localized strings in the UI via the `errors.*` namespace. This keeps
  the core library locale-free.
- **`@parsy/ui`** contains no display strings — only route metadata.
  Tool titles/descriptions live in the message files and are looked up by slug.

---

## 🔒 Security & privacy

- **No backend storage.** There is no API route that receives or persists user
  JSON. The app is a static front end.
- **Local persistence only stores preferences** (indent size, word wrap) — never
  your JSON. See `apps/web/store/json-store.ts` (`partialize`).
- Output is rendered through Monaco / standard React escaping to avoid XSS.

---

## 🧩 Tech stack

| Area | Choice |
| :--- | :--- |
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui-style components |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| i18n | next-intl (`zh` default + `en`, `/[locale]` routing) |
| State | Zustand (+ persist middleware) |
| Tooling | TypeScript 5, Turborepo, pnpm workspaces |
| Concurrency | Web Workers (`new Worker(new URL(...))`) |

---

## 📦 Project origin

Based on the _Parsy_ design document (v1.0). This repository
implements **Sprint 1** of the roadmap. Sprints 2–4 (Tree, Diff, Repair,
JSONPath, Schema, Converter, SEO sub-pages, CI, open-source docs) are planned.

---

## 📄 License

MIT © Morainet
