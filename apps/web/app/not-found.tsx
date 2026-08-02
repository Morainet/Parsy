import Link from "next/link";

/**
 * Root-level 404 fallback. Renders when a 404 is triggered OUTSIDE the
 * [locale] segment (e.g. a path that doesn't match any locale prefix), where
 * translations aren't available. Keeps the message generic/bilingual and
 * links to the default-locale home.
 */
export default function RootNotFound() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <div className="glow-primary pointer-events-none absolute inset-0 -z-10 opacity-40" />

      <span className="grid h-14 w-14 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <span className="font-mono text-lg font-bold">{"{}"}</span>
      </span>

      <p className="mt-8 text-6xl font-bold tracking-tight">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found / 页面未找到</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>

      <Link
        href="/zh"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:scale-105"
      >
        Back to home / 返回首页
      </Link>
    </div>
  );
}
