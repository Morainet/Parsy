import type { MetadataRoute } from "next";
import { TOOLS } from "@parsy/ui";
import { routing } from "@/i18n/routing";

/**
 * Dynamic sitemap. Emits one entry per (locale × route) so both /zh and /en
 * variants are indexable. Driven by the shared tool registry + the routing
 * config so new locales/tools appear automatically.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const origin = base.replace(/\/$/, "");
  const now = new Date();

  const liveTools = TOOLS.filter((t) => t.available);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    // Home
    entries.push({
      url: `${origin}/${locale}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${origin}/${l}`]),
        ),
      },
    });

    // Each live tool route
    for (const tool of liveTools) {
      entries.push({
        url: `${origin}/${locale}${tool.href}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.9,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [
              l,
              `${origin}/${l}${tool.href}`,
            ]),
          ),
        },
      });
    }
  }

  return entries;
}
