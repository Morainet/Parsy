import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * i18n middleware. Handles:
 *   - Redirecting the bare root `/` to the default locale (`/zh`).
 *   - Negotiating the locale from the URL prefix (and the locale cookie).
 *   - Leaving static assets, API routes, and Next internals untouched.
 *
 * (Next 15 still uses `middleware.ts`; the `proxy.ts` naming arrives in 16.)
 */
export default createMiddleware(routing);

export const config = {
  // Match all paths except: API/trpc, Next internals, Vercel internals,
  // and anything containing a dot (static files like favicon.ico, sitemap.xml
  // — wait, we WANT sitemap/robots handled? No: they're generated as routes,
  // not files-with-dots, so they're fine to exclude here too).
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
