import { cn } from "@/lib/utils";
import { formatINR, formatINRCompact } from "@/lib/money";

export function Amount({
  paise,
  className,
  tone = "default",
  compact = false,
  decimals = false,
}: {
  paise: number | bigint | null | undefined;
  className?: string;
  tone?: "default" | "positive" | "negative" | "muted";
  compact?: boolean;
  decimals?: boolean;
}) {
  const text = compact ? formatINRCompact(paise) : formatINR(paise, decimals);
  return (
    <span
      className={cn(
        "mono tabular-nums",
        tone === "positive" && "text-positive",
        tone === "negative" && "text-negative",
        tone === "muted" && "text-muted-fg",
        className
      )}
    >
      {text}
    </span>
  );
}
