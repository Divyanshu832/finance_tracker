"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  CreditCard,
  HandCoins,
  Briefcase,
  PiggyBank,
  Repeat,
  ArrowDownToLine,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/",              label: "Dashboard",     icon: LayoutDashboard, accent: "" },
  { href: "/income",        label: "Income",        icon: ArrowDownToLine, accent: "text-positive" },
  { href: "/expenses",      label: "Expenses",      icon: Receipt,         accent: "text-negative" },
  { href: "/bills",         label: "Bills & EMIs",  icon: CreditCard,      accent: "text-warning" },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat,          accent: "text-foreground" },
  { href: "/lending",       label: "Lending",       icon: HandCoins,       accent: "text-lending" },
  { href: "/ventures",      label: "Ventures",      icon: Briefcase,       accent: "text-venture" },
  { href: "/investments",   label: "Investments",   icon: PiggyBank,       accent: "text-invest" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-surface/30 sticky top-0 h-screen">
      <Link href="/" className="flex items-center gap-3 px-5 py-5">
        <div className="size-9 rounded-xl bg-foreground/5 grid place-items-center border border-border">
          <Wallet className="size-4" />
        </div>
        <div>
          <div className="text-base font-semibold tracking-tight leading-none">Munim</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-fg mt-1">Personal Ledger</div>
        </div>
      </Link>

      <nav className="px-3 mt-2 flex-1 flex flex-col gap-0.5">
        {items.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 px-3 h-9 rounded-lg text-sm transition",
                active
                  ? "bg-surface-2 text-foreground"
                  : "text-muted-fg hover:bg-surface-2/50 hover:text-foreground"
              )}
            >
              <Icon className={cn("size-4 shrink-0", active && it.accent)} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 mt-2 border-t border-border pt-3 flex flex-col gap-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-muted-fg hover:bg-surface-2/50 hover:text-foreground transition"
        >
          <Settings className="size-4" /> Settings
        </Link>
        <form action="/api/logout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-muted-fg hover:bg-surface-2/50 hover:text-foreground transition"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileTabBar() {
  const path = usePathname();
  const primary = items.slice(0, 5);
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
      <ul className="grid grid-cols-5">
        {primary.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2.5 gap-1 text-[10px]",
                  active ? "text-foreground" : "text-muted-fg"
                )}
              >
                <Icon className={cn("size-5", active && it.accent)} />
                <span>{it.label.split(" ")[0]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
