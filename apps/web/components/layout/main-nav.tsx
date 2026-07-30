"use client";

import { useTranslations } from "next-intl";
import { TOOLS } from "@parsy/ui";
import { Link, usePathname } from "@/i18n/navigation";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

/**
 * Primary site navigation.
 *
 * Uses the locale-aware `Link`/`usePathname` from `@/i18n/navigation` so paths
 * are written without a locale prefix and resolved automatically. Tool labels
 * come from the `tools.*.short` dictionary.
 */
export function MainNav({ className }: { className?: string }) {
  const t = useTranslations("site");
  const tTools = useTranslations("tools");
  const tNav = useTranslations("nav");
  const pathname = usePathname();

  const live = TOOLS.filter((tool) => tool.available);
  const soon = TOOLS.filter((tool) => !tool.available);

  return (
    <nav className={cn("flex items-center gap-0.5", className)} aria-label={tNav("main")}>
      <Link
        href="/"
        className="group mr-3 flex items-center gap-2.5 rounded-lg px-1.5 py-1"
      >
        <BrandMark
          size={32}
          className="transition-transform group-hover:scale-105"
        />
        <span className="hidden text-[15px] font-semibold tracking-tight sm:inline">
          {t("name")}
        </span>
      </Link>

      <div className="hidden items-center gap-0.5 md:flex">
        {live.map((tool) => {
          const active = pathname === tool.href;
          return (
            <Link
              key={tool.slug}
              href={tool.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {tTools(`${tool.slug}.short`)}
              {active && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>

      <span className="mx-1 hidden h-5 w-px bg-border lg:block" aria-hidden />

      <div className="hidden items-center lg:flex">
        {soon.slice(0, 2).map((tool) => (
          <span
            key={tool.slug}
            title={tNav("comingSoon", { name: tTools(`${tool.slug}.title`) })}
            className="cursor-not-allowed rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground/45"
          >
            {tTools(`${tool.slug}.title`)}
          </span>
        ))}
      </div>
    </nav>
  );
}
