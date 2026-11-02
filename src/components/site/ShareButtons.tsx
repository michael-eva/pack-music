import { useEffect, useRef, useState } from "react";

/** One share button that opens a choice of socials, plus copy link. */
export function ShareButtons({ title, path }: { title: string; path: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [instance, setInstance] = useState("mastodon.social");
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function url() {
    if (typeof window === "undefined") return `https://packmusic.au${path}`;
    return `${window.location.origin}${path}`;
  }

  const btn =
    "press inline-flex items-center rounded-full border-2 border-ink px-4 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-ink";
  const item =
    "block w-full rounded-full px-3 py-2 text-left font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] text-ink hover:bg-ink/10";

  async function onShare() {
    const link = url();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: link });
        return;
      } catch {
        /* dismissed – show the menu instead */
      }
    }
    setOpen((v) => !v);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const enc = () => encodeURIComponent(url());
  const text = () => encodeURIComponent(title);

  const links = () => [
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc()}` },
    { label: "Bluesky", href: `https://bsky.app/intent/compose?text=${text()}%20${enc()}` },
    {
      label: "Mastodon",
      href: `https://${instance.replace(/^https?:\/\//, "").replace(/\/$/, "")}/share?text=${text()}%20${enc()}`,
    },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc()}` },
  ];

  return (
    <div ref={wrap} className="relative flex flex-wrap items-center gap-3">
      <span className="font-mono text-[0.68rem] uppercase tracking-[0.25em] text-ink/70">Share</span>
      <button type="button" onClick={onShare} className={btn} aria-expanded={open}>
        {copied ? "Link copied" : "Share this post"}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-60 rounded-2xl border-2 border-ink bg-paper p-2 shadow-[4px_4px_0_0_var(--color-ink)]">
          {links().map((l) => (
            <a key={l.label} className={item} href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          ))}
          <button type="button" className={item} onClick={copy}>
            {copied ? "Link copied" : "Copy link"}
          </button>
          <label className="mt-2 block px-3 pb-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink/60">
            Mastodon instance
            <input
              value={instance}
              onChange={(e) => setInstance(e.target.value)}
              className="mt-1 w-full rounded-full border-2 border-ink bg-transparent px-3 py-1 font-mono text-[0.68rem] tracking-normal text-ink"
            />
          </label>
        </div>
      )}
    </div>
  );
}
