/** Post cover image, or an empty placeholder slot until one is uploaded in admin. */
export function CoverSlot({
  src,
  alt = "",
  className = "aspect-[3/2]",
}: {
  src?: string | null | undefined;
  alt?: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`xerox-photo w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`flex w-full items-center justify-center border-b-2 border-dashed border-ink/25 bg-ink/[0.06] ${className}`}
    >
      <span className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-ink/45">
        Photo
      </span>
    </div>
  );
}
