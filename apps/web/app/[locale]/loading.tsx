/**
 * Route-segment loading skeleton. Shown while a tool page's JS bundle
 * hydrates (mainly the Monaco editor chunk). Keeps the shell (header/footer)
 * visible so transitions feel instant rather than blank.
 */
export default function Loading() {
  return (
    <div className="mx-auto flex h-[calc(100svh-4rem)] max-w-[1600px] flex-col px-4 py-5 sm:px-6">
      {/* Header skeleton */}
      <div className="mb-4">
        <div className="h-7 w-64 animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded-md bg-muted/70" />
      </div>

      {/* Toolbar skeleton */}
      <div className="mb-4 h-12 animate-pulse rounded-xl bg-muted/60" />

      {/* Editor panes skeleton */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 py-4 md:grid-cols-2">
        <div className="animate-pulse rounded-xl bg-muted/50" />
        <div className="animate-pulse rounded-xl bg-muted/50" />
      </div>

      {/* Status bar skeleton */}
      <div className="mt-4 h-10 animate-pulse rounded-xl bg-muted/60" />
    </div>
  );
}
