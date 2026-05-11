"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wallet, Settings, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, MOBILE_PRIMARY } from "./nav-items";
import { MobileMoreSheet } from "./mobile-more-sheet";

const STORAGE_KEY = "munim:sidebar:collapsed";

export function Sidebar() {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setCollapsed(stored === "1");
    setHydrated(true);
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 border-r border-border bg-surface/30 sticky top-0 h-screen transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-60"
      )}
      style={{ visibility: hydrated ? "visible" : "visible" }}
    >
      <div className={cn("flex items-center gap-3 px-4 py-5", collapsed && "justify-center px-0")}>
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-foreground/5 grid place-items-center border border-border shrink-0">
            <Wallet className="size-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-base font-semibold tracking-tight leading-none">Munim</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-fg mt-1">Personal Ledger</div>
            </div>
          )}
        </Link>
      </div>

      <nav className={cn("flex-1 flex flex-col gap-0.5", collapsed ? "px-2" : "px-3 mt-2")}>
        {NAV.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              title={collapsed ? it.label : undefined}
              className={cn(
                "flex items-center gap-3 h-9 rounded-lg text-sm transition",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-surface-2 text-foreground"
                  : "text-muted-fg hover:bg-surface-2/50 hover:text-foreground"
              )}
            >
              <Icon className={cn("size-4 shrink-0", active && it.accent)} />
              {!collapsed && <span className="truncate">{it.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("pb-4 border-t border-border pt-3 flex flex-col gap-0.5", collapsed ? "px-2" : "px-3 mt-2")}>
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 h-9 rounded-lg text-sm text-muted-fg hover:bg-surface-2/50 hover:text-foreground transition",
            collapsed ? "justify-center px-0" : "px-3"
          )}
        >
          <Settings className="size-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <form action="/api/logout" method="post">
          <button
            type="submit"
            title={collapsed ? "Log out" : undefined}
            className={cn(
              "w-full flex items-center gap-3 h-9 rounded-lg text-sm text-muted-fg hover:bg-surface-2/50 hover:text-foreground transition",
              collapsed ? "justify-center px-0" : "px-3"
            )}
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </form>
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "Expand" : "Collapse"}
          className={cn(
            "mt-2 flex items-center gap-3 h-9 rounded-lg text-sm text-muted-fg hover:bg-surface-2/50 hover:text-foreground transition",
            collapsed ? "justify-center px-0" : "px-3"
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-4 shrink-0" /> : <PanelLeftClose className="size-4 shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

export function MobileTabBar() {
  const path = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
      <ul className="grid grid-cols-5">
        {MOBILE_PRIMARY.map((it) => {
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
        <li>
          <MobileMoreSheet />
        </li>
      </ul>
    </nav>
  );
}
