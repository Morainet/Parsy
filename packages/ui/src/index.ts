/**
 * @parsy/ui
 *
 * Shared, framework-agnostic design tokens and the tool/route registry.
 *
 * IMPORTANT (i18n): this package deliberately contains NO user-facing strings.
 * Tool titles/descriptions and site name/tagline live in the web app's
 * message dictionaries (`messages/zh.json`, `messages/en.json`) and are
 * resolved at render time via `next-intl`. This keeps the package free of any
 * i18n dependency and lets the registry be consumed by nav, homepage cards,
 * and the sitemap as pure route metadata.
 *
 * The `slug` is the join key used to look up localized strings, e.g.
 * `t('tools.json-formatter.title')`.
 */

/** Pure route metadata for a tool. No display strings here. */
export interface ToolEntry {
  /** URL segment under the locale, e.g. "json-formatter" → /zh/json-formatter. */
  slug: string;
  /** Path WITHOUT locale prefix (locale is prepended by the localized Link). */
  href: string;
  /** Short emoji glyph for the nav / card. */
  icon: string;
  /** Whether the page is live in this release. */
  available: boolean;
}

/**
 * Central tool registry. Consumed by the header nav, the homepage tool grid,
 * the sitemap, and the SEO route list. Adding a tool = one entry here + a
 * block in each message file under `tools.<slug>`.
 */
export const TOOLS: readonly ToolEntry[] = [
  { slug: "json-formatter", href: "/json-formatter", icon: "✨", available: true },
  { slug: "json-validator", href: "/json-validator", icon: "✔️", available: true },
  { slug: "json-minifier", href: "/json-minifier", icon: "🗜️", available: true },
  { slug: "json-tree", href: "/json-tree", icon: "🌳", available: true },
  { slug: "json-diff", href: "/json-diff", icon: "🔍", available: false },
  { slug: "json-repair", href: "/json-repair", icon: "🛠️", available: false },
  { slug: "json-converter", href: "/json-to-typescript", icon: "💻", available: false },
] as const;

/**
 * Default site base URL. The web app reads `NEXT_PUBLIC_SITE_URL` at build
 * time (Next.js inlines it); this constant is the fallback used by shared
 * helpers that run outside the Next bundler.
 *
 * Kept free of any `process`/`@types/node` dependency so the package stays
 * framework-agnostic and type-checks on its own.
 */
export const SITE_URL = "http://localhost:3000";
