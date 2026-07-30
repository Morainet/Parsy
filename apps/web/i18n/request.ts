import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/** True when `value` is one of our supported locales. */
function isLocale(value: unknown): value is (typeof routing.locales)[number] {
  return (
    typeof value === "string" &&
    (routing.locales as readonly string[]).includes(value)
  );
}

/**
 * Per-request config: resolves the locale and loads the matching message
 * dictionary. Runs on both the server and during static generation.
 *
 * `requestLocale` comes from the `[locale]` route segment (set via
 * `setRequestLocale` in the layout). If it's missing/invalid we fall back to
 * the default locale.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
