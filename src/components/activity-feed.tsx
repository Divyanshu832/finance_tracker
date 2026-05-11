import {
  ArrowDownToLine, Receipt, CreditCard, Repeat, HandCoins,
  Briefcase, PiggyBank, CircleDollarSign, type LucideIcon,
} from "lucide-react";
import { Amount } from "@/components/money/amount";
import { fmtDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/dashboard-data";

const ICONS: Record<string, { icon: LucideIcon; class: string }> = {
  income:        { icon: ArrowDownToLine, class: "text-positive" },
  expense:       { icon: Receipt,         class: "text-negative" },
  bill:          { icon: CreditCard,      class: "text-warning" },
  subscription:  { icon: Repeat,          class: "text-foreground" },
  lending:       { icon: HandCoins,       class: "text-lending" },
  settlement:    { icon: CircleDollarSign,class: "text-lending" },
  contribution:  { icon: Briefcase,       class: "text-venture" },
  investment:    { icon: PiggyBank,       class: "text-invest" },
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-muted-fg">
        Nothing here yet. Add income or an expense to get started.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((a) => {
        const ic = ICONS[a.kind] ?? ICONS.expense;
        const Icon = ic.icon;
        const tone = a.tone === "positive" ? "positive" : a.tone === "negative" ? "negative" : "muted";
        return (
          <li key={`${a.kind}_${a.id}`} className="flex items-center gap-3 px-5 py-3">
            <div className="size-8 rounded-lg bg-surface-2 border border-border grid place-items-center shrink-0">
              <Icon className={cn("size-3.5", ic.class)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{a.title}</div>
              <div className="text-[11px] text-muted-fg mt-0.5 flex gap-1.5">
                {a.subtitle && <span className="truncate">{a.subtitle} ·</span>}
                <span>{fmtDate(a.date, "d MMM")}</span>
              </div>
            </div>
            <Amount paise={a.amount} tone={tone} className="text-sm" />
          </li>
        );
      })}
    </ul>
  );
}
