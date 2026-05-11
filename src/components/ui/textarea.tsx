"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[72px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm",
        "placeholder:text-muted-fg outline-none transition focus:border-foreground/30",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
