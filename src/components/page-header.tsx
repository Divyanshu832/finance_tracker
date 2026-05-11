import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {Icon && (
          <div className="size-10 rounded-xl bg-surface border border-border grid place-items-center shrink-0">
            <Icon className={cn("size-5", iconClassName)} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-fg mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 [&_button]:w-full sm:[&_button]:w-auto">{action}</div>}
    </div>
  );
}
