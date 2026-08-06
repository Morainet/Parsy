import "./globals.css";

/**
 * Root layout.
 *
 * With next-intl's `[locale]` routing, the full `<html lang>` / `<body>` tags
 * with fonts and providers live in `app/[locale]/layout.tsx`. However, Next.js
 * requires the root layout to produce a valid HTML document — so we provide
 * a minimal `<html>/<body>` shell here. When the `[locale]` layout renders
 * (the normal case), it overrides these tags with the localized versions.
 *
 * The global stylesheet is imported here so it applies in all cases.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
