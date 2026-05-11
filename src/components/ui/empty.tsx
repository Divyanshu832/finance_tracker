import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function Empty({
  icon: Icon,
  title,
  hint,
  className,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-14 px-6", className)}>
      <div className="size-12 rounded-2xl bg-surface-2 border border-border grid place-items-center mb-3">
        <Icon className="size-5 text-muted-fg" />
      </div>
      <div className="font-medium">{title}</div>
      {hint && <div className="text-sm text-muted-fg mt-1 max-w-xs">{hint}</div>}
    </div>
  );
}
