"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatDuration, byteLength } from "@/lib/utils";
import type { ToolStatus } from "@/store/json-store";

interface StatusBarProps {
  status: ToolStatus;
  input: string;
  output: string;
  /** Already-localized error message (translated from the error code). */
  errorMessage: string;
}

/**
 * Bottom strip showing live validation state, input/output sizes, and the
 * last operation's wall-clock time. All text is localized.
 */
export function StatusBar({ status, input, output, errorMessage }: StatusBarProps) {
  const t = useTranslations("tool.status");

  const inputBytes = byteLength(input);
  const outputBytes = byteLength(output);
  const showOutput = output.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-border bg-card/80 px-4 py-2.5 text-xs text-muted-foreground shadow-soft backdrop-blur">
      <StatusPill status={status} errorMessage={errorMessage} />

      <span aria-hidden className="hidden h-3 w-px bg-border sm:block" />

      <Metric label={t("input")}>
        {input.length.toLocaleString()} {t("chars")} · {formatBytes(inputBytes)}
      </Metric>

      {showOutput && (
        <Metric label={t("output")}>
          {output.length.toLocaleString()} {t("chars")} · {formatBytes(outputBytes)}
        </Metric>
      )}

      {status.durationMs != null && (
        <Metric label={t("time")}>{formatDuration(status.durationMs)}</Metric>
      )}
    </div>
  );
}

function StatusPill({
  status,
  errorMessage,
}: {
  status: ToolStatus;
  errorMessage: string;
}) {
  const t = useTranslations("tool.status");
  if (status.state === "processing") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> {t("processing")}
      </Badge>
    );
  }
  if (status.state === "invalid" && status.error) {
    const { line, column } = status.error;
    return (
      <span className="inline-flex max-w-full items-center gap-1.5 text-destructive">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate" title={errorMessage}>
          {errorMessage}
        </span>
        <span className="shrink-0 font-mono text-[11px] text-destructive/80">
          {t("lineCol", { line, column })}
        </span>
      </span>
    );
  }
  if (status.state === "valid") {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="h-3 w-3" /> {t("valid")}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      {t("idle")}
    </Badge>
  );
}

function Metric({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono">
      <span className="text-muted-foreground/70">{label}</span>
      <span className="text-foreground/90">{children}</span>
    </span>
  );
}
