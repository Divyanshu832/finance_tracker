"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm",
        "placeholder:text-muted-fg outline-none transition focus:border-foreground/30",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
