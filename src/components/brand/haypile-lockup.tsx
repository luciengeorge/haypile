import { HaypileMark, type Tone } from "@/components/brand/haypile-mark";
import { cn } from "@/lib/utils";

type LockupProps = {
  className?: string;
  size?: number;
  tone?: Tone;
};

export function HaypileLockup({ className, size = 28, tone = "default" }: LockupProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <HaypileMark size={size} tone={tone} />
      <span
        className={cn(
          "font-display text-2xl leading-none font-semibold tracking-tight",
          tone === "reversed" ? "text-primary-foreground" : "text-foreground",
        )}
      >
        Haypile
      </span>
    </span>
  );
}
