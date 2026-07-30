import { cn } from "@/lib/utils";

/**
 * BrandMark — the inline logo glyph used in the header and footer.
 *
 * Visually identical to the favicon (`app/icon.svg`): three offset rounded
 * bars (white / indigo / white) on a charcoal squircle, evoking nested JSON
 * levels. Rendered as inline SVG so it stays crisp at any size and inherits
 * nothing from the surrounding text styles.
 *
 * Use this everywhere the Parsy logo mark appears in the UI so the brand
 * stays consistent with the favicon.
 */
export function BrandMark({
  className,
  size = 32,
}: {
  className?: string;
  /** Pixel size of the square mark (width = height). */
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role="img"
      aria-label="Parsy"
      className={cn("shrink-0", className)}
    >
      <rect width="512" height="512" rx="116" ry="116" fill="#0e0f1a" />
      <rect x="140" y="148" width="232" height="56" rx="28" fill="#ffffff" />
      <rect x="172" y="228" width="232" height="56" rx="28" fill="#6366f1" />
      <rect x="140" y="308" width="232" height="56" rx="28" fill="#ffffff" />
    </svg>
  );
}
