"use client";

import * as React from "react";
import { useTransition } from "react";
import { Languages, Check } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Language switcher. Switches the locale while preserving the current path,
 * using next-intl's locale-aware router so the URL updates to /<locale>/...
 *
 * Renders a stable trigger (no locale-dependent text on the button itself)
 * to avoid hydration mismatch; the current language is shown in the menu.
 */
export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const switchTo = (next: string) => {
    if (next === locale) return;
    startTransition(() => {
      // `pathname` is already locale-stripped by the localized usePathname,
      // so passing it back keeps the user on the same page in the new locale.
      router.replace(pathname, { locale: next });
    });
  };

  const currentLabel =
    mounted && locale === "zh" ? "中文" : locale === "en" ? "EN" : locale.toUpperCase();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isPending}
              aria-label="Language"
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <Languages className="h-[18px] w-[18px]" />
              <span className="hidden text-xs sm:inline">{currentLabel}</span>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Language / 语言</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuLabel>Language / 语言</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchTo(loc)}
            className="justify-between"
          >
            <span>{loc === "zh" ? "简体中文" : "English"}</span>
            {loc === locale && <Check className={cn("h-4 w-4 text-primary")} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
