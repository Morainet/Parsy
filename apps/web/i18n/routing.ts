import { defineRouting } from "next-intl/routing";

/**
 * Central i18n routing config. `next-intl`'s middleware, navigation helpers,
 * and request config all consume this single source of truth.
 *
 * - `zh` is the default locale (the product's primary audience).
 * - `localePrefix: 'always'` keeps URLs consistent (/zh/..., /en/...) which is
 *   best for SEO and shareable links.
 */
export const routing = defineRouting({
  locales: ["zh", "en"],
  defaultLocale: "zh",
  localePrefix: "always",
});
