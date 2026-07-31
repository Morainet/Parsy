"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface DiffInputProps {
  /** Current JSON text. */
  value: string;
  /** Called on every keystroke. */
  onChange: (value: string) => void;
  /** Which side this is — drives the label + accent color. */
  side: "original" | "modified";
  /** Validity of the JSON, for the corner indicator. */
  state: "empty" | "valid" | "invalid";
}

/**
 * A compact, labeled JSON input textarea used in pairs by the Diff page.
 * Lighter than a full Monaco editor — the syntax highlighting happens in the
 * diff result below; this is just the source input.
 */
export function DiffInput({ value, onChange, side, state }: DiffInputProps) {
  const t = useTranslations("diff");
  const accent = side === "original" ? "bg-primary/70" : "bg-success";

  return (
    <div className="relative flex min-h-[160px] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {/* Floating label chip */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2">
        <span className="select-none rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
          {t(side)}
        </span>
        {value.trim().length > 0 && (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              state === "invalid" ? "bg-destructive" : accent,
            )}
            aria-hidden
          />
        )}
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        placeholder={t("placeholder")}
        aria-label={t(side)}
        className={cn(
          "h-full min-h-[160px] w-full flex-1 resize-none rounded-xl border-0 bg-transparent px-3 pt-9 pb-3",
          "font-mono text-sm leading-6 text-foreground",
          "placeholder:text-muted-foreground/60 focus-visible:outline-none",
        )}
      />
    </div>
  );
}
