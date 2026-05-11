"use client";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function DeleteButton({
  action,
  className,
  label = "Delete",
}: {
  action: () => Promise<unknown>;
  className?: string;
  label?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title={label}
      disabled={pending}
      onClick={() => start(async () => { await action(); })}
      className={cn(
        "size-8 grid place-items-center rounded-md text-muted-fg hover:bg-negative/10 hover:text-negative transition disabled:opacity-50",
        className
      )}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
