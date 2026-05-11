"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { MoreHorizontal, Settings, LogOut, X } from "lucide-react";
import { NAV } from "./nav-items";
import { cn } from "@/lib/utils";

export function MobileMoreSheet() {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className="w-full flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] text-muted-fg"
        >
          <MoreHorizontal className="size-5" />
          <span>More</span>
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "md:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-surface",
            "p-5 pb-8 shadow-2xl shadow-black/40",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <DialogPrimitive.Title className="text-base font-semibold tracking-tight">All sections</DialogPrimitive.Title>
            <DialogPrimitive.Close className="size-8 grid place-items-center rounded-md text-muted-fg hover:bg-surface-2 hover:text-foreground">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {NAV.map((it) => {
              const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-3 transition",
                    active
                      ? "bg-surface-2 border-foreground/20 text-foreground"
                      : "bg-background border-border text-muted-fg hover:text-foreground"
                  )}
                >
                  <div className="size-10 rounded-xl bg-surface-2 border border-border grid place-items-center">
                    <Icon className={cn("size-4", active && it.accent)} />
                  </div>
                  <span className="text-[11px] text-center leading-tight">{it.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 border-t border-border pt-3">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm text-muted-fg hover:text-foreground transition"
            >
              <Settings className="size-4" /> Settings
            </Link>
            <form action="/api/logout" method="post">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm text-muted-fg hover:text-foreground transition"
              >
                <LogOut className="size-4" /> Log out
              </button>
            </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
