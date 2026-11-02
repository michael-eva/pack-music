import type { ReactNode } from "react";

/**
 * Zine-styled disclosure. Uses native <details> so the content stays in the
 * DOM for search engines and in-page find, while the page reads short.
 */
export function Fold({
  summary,
  kicker,
  sub,
  media,
  children,
  open = false,
  className = "",
}: {
  summary: string;
  kicker?: string;
  /** Always-visible one-liner under the heading. */
  sub?: string;
  /** Optional leading visual, e.g. a headshot. */
  media?: ReactNode;
  children: ReactNode;
  open?: boolean;
  className?: string;
}) {
  return (
    <details open={open} className={`fold zine grain group ${className}`}>
      <summary className="relative grid cursor-pointer list-none grid-cols-1 gap-4 px-8 py-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-7 sm:px-10">
        {media}
        <span className="min-w-0">
          {kicker ? <span className="cutout-label mb-2 inline-block">{kicker}</span> : null}
          <span className="block font-display text-xl uppercase leading-tight">{summary}</span>
          {sub ? <span className="mt-1.5 block text-sm leading-relaxed opacity-80">{sub}</span> : null}
        </span>
        <span
          aria-hidden="true"
          className="absolute right-6 top-6 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink font-display text-lg leading-none transition-transform group-open:rotate-45 sm:static sm:mt-1"
        >
          +
        </span>
      </summary>
      <div className="px-8 pb-8 text-base leading-relaxed sm:px-10">{children}</div>
    </details>
  );
}

/** Stack of folds with hairline separations. */
export function FoldStack({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-8 ${className}`}>{children}</div>;
}
