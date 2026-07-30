import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Conditionally join Tailwind classes and resolve conflicts.
 * Standard shadcn/ui helper.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a byte count as a compact human string (e.g. "12.3 KB"). */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, i);
  const digits = i === 0 ? 0 : value < 10 ? 2 : 1;
  return `${value.toFixed(digits)} ${units[i]}`;
}

/** Format milliseconds as a short duration string (e.g. "12 ms", "1.2 s"). */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/** Rough UTF-8 byte size of a string without allocating a Blob. */
export function byteLength(text: string): number {
  // Fast path for pure ASCII (very common for JSON keys/numbers).
  if (/^[\x00-\x7f]*$/.test(text)) return text.length;
  return new TextEncoder().encode(text).length;
}
