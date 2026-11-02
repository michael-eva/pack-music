
type Props = {
  /** "full" = Stanley + pack music/ wordmark, "mark" = Stanley only */
  variant?: "full" | "mark";
  /** any Tailwind text-* colour class drives the logo colour */
  className?: string;
  title?: string;
};

/**
 * The Pack logo, rendered as a mask so it inherits currentColor –
 * lets the mark appear in white or any brand colour per the style guide.
 */
export function PackLogo({ variant = "full", className = "", title = "pack music" }: Props) {
  const src = variant === "full" ? "/brand/pack-logo.png" : "/brand/pack-mark.png";
  const ratio = variant === "full" ? "925 / 779" : "427 / 379";

  return (
    <span
      role="img"
      aria-label={title}
      className={className}
      style={{
        display: "inline-block",
        aspectRatio: ratio,
        backgroundColor: "currentColor",
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
