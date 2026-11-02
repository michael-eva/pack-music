import type { CSSProperties, ReactNode } from "react";

export type Tone = "electric" | "magenta" | "lime" | "ember" | "deep" | "sunset";

const TONES: Record<Tone, { bg: string; text: string; dark: boolean }> = {
  electric: { bg: "grad-blue-magenta", text: "text-paper", dark: true },
  magenta: { bg: "grad-pink-peach", text: "text-ink", dark: false },
  lime: { bg: "grad-cyan-green-yellow", text: "text-ink", dark: false },
  ember: { bg: "grad-orange-yellow", text: "text-ink", dark: false },
  deep: { bg: "grad-deep-blue", text: "text-paper", dark: true },
  sunset: { bg: "grad-pink-orange", text: "text-paper", dark: true },
};

/** Stanley animation from the brand kit. He always faces left, so `flip`
 *  turns him to face whatever he's talking to. Always rendered as a solid
 *  black silhouette at a consistent size, with no outline or shadow. */
export function Stanley({
  src,
  alt = "Stanley, The Pack's dog, animated",
  className = "",
  flip = false,
  style,
}: {
  src: string;
  alt?: string | undefined;
  className?: string;
  flip?: boolean;
  /** @deprecated kept for call-site compatibility; Stanley is always black. */
  dark?: boolean;
  /** @deprecated kept for call-site compatibility; Stanley is always black. */
  plain?: boolean;
  /** @deprecated kept for call-site compatibility; Stanley never has a shadow. */
  shadow?: string | false | null;
  style?: CSSProperties | undefined;
}) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ filter: "brightness(0) saturate(100%)", ...style }}
      className={`pointer-events-none select-none ${flip ? "scale-x-[-1]" : ""} ${className}`}
    />
  );
}

/** One gradient for the whole page, with the brand wave-particle field over it. */
export function PageShell({ tone = "electric", children }: { tone?: Tone; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <div className={`wave-field ${t.dark ? "" : "wave-field-ink"} ${t.bg} ${t.text}`}>
      {children}
    </div>
  );
}

export function PageHero({
  tk,
  eyebrow,
  title,
  lead,
  gif,
  gifAlt,
  gifShadow = "#ff2cdf",
  gifPlain = false,
  aside,
}: {
  /** Optional picture shown beside the heading + lead on wide screens. */
  aside?: ReactNode;
  /** Copy key prefix, so the header text can be edited in Admin → Page text. */
  tk?: string;
  eyebrow?: string;
  title?: ReactNode;
  lead?: string;
  gif?: string;
  gifAlt?: string | undefined;
  gifShadow?: string | false | null;
  gifPlain?: boolean;
}) {
  return (
    <section>
      <div
        className={`page-wrap px-5 pb-10 pt-14 sm:pb-12 sm:pt-16 ${aside ? "grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14" : ""}`}
      >
        <div>
          <span className="stamp mono-kicker inline-block px-3 py-1.5">{eyebrow}</span>
          <div className="mt-5 flex items-center gap-2 text-5xl sm:gap-4 sm:text-7xl xl:text-8xl">
            <h1 className="max-w-4xl flex-1 text-[1em] leading-[1.05] xl:max-w-5xl">{title}</h1>
          </div>

          <p className="mt-5 max-w-2xl text-lg sm:text-xl xl:max-w-3xl xl:text-2xl">{lead}</p>
        </div>
        {aside ? (
          <div className="mx-auto w-full max-w-sm lg:mx-0 lg:w-[19rem] xl:w-[22rem]">{aside}</div>
        ) : null}
      </div>
    </section>
  );
}

export function Slab({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="page-wrap px-5 py-14 sm:py-18">{children}</div>
    </section>
  );
}

/** Photocopied flyer card. */
export function Point({
  tk,
  kicker,
  title,
  body,
  tilt = "l",
}: {
  /** Copy key prefix, so the card text can be edited in Admin → Page text. */
  tk?: string;
  kicker?: string;
  title?: string;
  body?: string;
  tilt?: "l" | "r" | "none";
}) {
  const rot = tilt === "l" ? "tilt-l" : tilt === "r" ? "tilt-r" : "";
  return (
    <div className={`zine grain relative p-7 pt-9 ${tilt === "r" ? "zine-b" : ""} ${rot}`}>
      <span
        aria-hidden
        className={`tape-strip absolute -top-3 z-10 h-7 w-28 ${tilt === "r" ? "right-7 rotate-6" : "left-7 -rotate-5"}`}
      />

      <span className="cutout-label">{kicker}</span>
      <h3 className="mt-4 text-2xl uppercase">{title}</h3>
      <p className="mt-3 text-base leading-relaxed">{body}</p>
    </div>
  );
}

/** Stanley, flipped so he faces the bubble coming out of his mouth. */
export function StanleySays({
  children,
  gif,
  gifAlt,
  gifShadow = "#00ff5b",
  gifPlain = false,
}: {
  children: ReactNode;
  gif?: string;
  gifAlt?: string | undefined;
  gifShadow?: string;
  gifPlain?: boolean;
}) {
  return (
    <div className="mt-12 flex flex-wrap items-center gap-2 sm:gap-4">
      {gif ? (
        <Stanley
          src={gif}
          alt={gifAlt}
          flip
          plain={gifPlain}
          shadow={gifShadow}
          className="stanley-size shrink-0 object-contain"
        />
      ) : null}

      <div className="bubble grain inline-block max-w-xl px-8 py-6 text-sm font-bold uppercase tracking-widest">
        <span className="text-electric">Stanley says: {children}</span>
      </div>
    </div>
  );
}

/** The packmusic.au pill that closes almost every brand asset. */
export function PackPill({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex rounded-full border-2 border-current px-5 py-2 font-mono text-sm uppercase tracking-[0.25em] ${className}`}
    >
      packmusic.au
    </span>
  );
}

/** Pasted-in brand photo, mounted on hand-torn paper. Three DIY treatments:
 *  taped polaroid, bare torn cut-out, and a torn cut-out with a hard shadow. */
const PHOTO_RATIO = {
  landscape: "aspect-[4/3]",
  wide: "aspect-[3/2]",
  square: "aspect-square",
  portrait: "aspect-[4/5]",
} as const;

export function PhotoSticker({
  src,
  alt,
  className = "",
  tilt = "r",
  variant = "polaroid",
  caption,
  ratio = "landscape",
}: {
  src: string;
  alt: string;
  className?: string;
  tilt?: "l" | "r" | "none";
  variant?: "polaroid" | "torn" | "cutout";
  caption?: string;
  /** Crop shape, so the photo fills the space it sits in. */
  ratio?: keyof typeof PHOTO_RATIO;
}) {
  const rot = tilt === "l" ? "-rotate-2" : tilt === "r" ? "rotate-2" : "";
  /** Photos fill their column, with a cap so they never blow out. */
  const frame = `relative mx-auto w-full max-w-md sm:max-w-lg lg:max-w-none ${rot} ${className}`;
  const img = (
    <img
      src={src}
      alt={alt}
      width={1200}
      height={900}
      loading="lazy"
      className={`xerox-photo w-full object-cover ${PHOTO_RATIO[ratio]}`}
    />
  );

  if (variant === "torn") {
    return (
      <figure className={frame}>
        <div className="torn-frame grain relative p-2.5">{img}</div>
        {caption ? (
          <figcaption className="mono-kicker mt-4 text-center opacity-80">{caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  if (variant === "cutout") {
    return (
      <figure className={frame}>
        <div className="torn-frame torn-frame-b grain relative p-2">{img}</div>
        {caption ? (
          <figcaption className="mono-kicker mt-4 text-center opacity-80">{caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <figure className={frame}>
      <span
        aria-hidden
        className="tape-strip pointer-events-none absolute -left-6 top-6 z-20 h-8 w-28 -rotate-[38deg] sm:w-32"
      />
      <span
        aria-hidden
        className="tape-strip pointer-events-none absolute -right-6 top-6 z-20 h-8 w-28 rotate-[38deg] sm:w-32"
      />
      <div className="torn-frame grain relative p-6 pb-6 sm:p-8 sm:pb-7">
        {img}
        {caption ? (
          <figcaption className="pt-5 pb-3 text-center font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink/75">
            {caption}
          </figcaption>
        ) : null}
      </div>
    </figure>
  );
}

/** Aged-paper panel, torn out on every edge. */
export function TornPanel({
  children,
  className = "",
  tilt = "none",
}: {
  children: ReactNode;
  className?: string;
  tilt?: "l" | "r" | "none";
}) {
  const rot = tilt === "l" ? "tilt-l" : tilt === "r" ? "tilt-r" : "";
  return (
    <div className={`zine zine-b grain relative text-ink ${rot} ${className}`}>{children}</div>
  );
}

/** Small cut-out kicker label, ransom-note style. */
export function CutoutLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`cutout-label ${className}`}>{children}</span>;
}
