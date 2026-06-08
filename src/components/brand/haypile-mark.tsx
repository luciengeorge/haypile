// Fixed brand constants (not theme tokens — the mark is invariant across light/dark).
const BONE = "#F2EEE5";
const VERDIGRIS = "#2E7D6E";
const GOLD = "#C2933A";

export type Tone = "default" | "reversed";

type MarkProps = {
  className?: string;
  size?: number;
  // "default" = verdigris squircle + bone strata. "reversed" = bare bone strata for
  // verdigris / dark grounds (no squircle).
  tone?: Tone;
};

export function HaypileMark({ className, size = 28, tone = "default" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Haypile"
    >
      {tone === "default" ? <rect x="2" y="2" width="60" height="60" rx="17" fill={VERDIGRIS} /> : null}
      <rect x="16" y="19" width="32" height="6" rx="3" fill={BONE} />
      <rect x="16" y="30" width="32" height="6" rx="3" fill={BONE} />
      <rect x="16" y="41" width="19" height="6" rx="3" fill={BONE} />
      <circle cx="42" cy="44" r="3.4" fill={GOLD} />
    </svg>
  );
}
