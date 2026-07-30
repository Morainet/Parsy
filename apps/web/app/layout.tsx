import "./globals.css";

/**
 * Root layout — intentionally minimal.
 *
 * With next-intl's `[locale]` routing, the `<html>`/`<body>` tags (which need
 * the dynamic `lang` attribute) live in `app/[locale]/layout.tsx`, where the
 * locale param is in scope. This root layout just passes children through so
 * the locale layout can own the document shell.
 *
 * We still import the global stylesheet here so it applies regardless of
 * which layout renders first.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
