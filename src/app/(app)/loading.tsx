import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-fg">
      <Loader2 className="size-6 animate-spin" />
      <div className="text-xs uppercase tracking-wider">Loading…</div>
    </div>
  );
}
