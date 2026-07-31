"use client";

import { FileJson, CircleCheck, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

interface TreeEmptyProps {
  state: "empty" | "valid-empty" | "error";
  errorMessage?: string;
  errorLine?: number | null;
  errorColumn?: number | null;
}

/**
 * Placeholder shown in the tree pane before any JSON is entered, or when the
 * input is invalid. Mirrors the EmptyOutput design language of JsonTool.
 */
export function TreeEmpty({ state, errorMessage, errorLine, errorColumn }: TreeEmptyProps) {
  const t = useTranslations("tree.empty");

  if (state === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center animate-scale-in">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <TriangleAlert className="h-7 w-7" />
        </div>
        <p className="font-medium text-destructive">{t("invalidJson")}</p>
        {errorMessage && (
          <p className="max-w-md text-sm text-muted-foreground">{errorMessage}</p>
        )}
        {errorLine != null && errorColumn != null && (
          <p className="font-mono text-xs text-muted-foreground">
            {t("lineCol", { line: errorLine, column: errorColumn })}
          </p>
        )}
      </div>
    );
  }

  if (state === "valid-empty") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground animate-scale-in">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-success/10 text-success">
          <CircleCheck className="h-7 w-7" />
        </div>
        <p className="font-medium text-foreground">{t("emptyValue")}</p>
        <p className="text-xs">{t("emptyValueHint")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground animate-fade-in">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground/70">
        <FileJson className="h-7 w-7" />
      </div>
      <p className="font-medium">{t("placeholder")}</p>
      <p className="max-w-xs text-xs">{t("placeholderHint")}</p>
    </div>
  );
}
