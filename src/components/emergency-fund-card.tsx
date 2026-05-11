"use client";
import { useState, useTransition } from "react";
import { ShieldCheck, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Amount } from "@/components/money/amount";
import { toast } from "sonner";
import { setEmergencyTarget } from "@/actions/settings";
import { paiseToRupees } from "@/lib/money";

export function EmergencyFundCard({
  target,
  saved,
}: {
  target: number;
  saved: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  const remaining = Math.max(0, target - saved);
  const done = target > 0 && saved >= target;

  const onSubmit = (formData: FormData) => {
    start(async () => {
      try {
        await setEmergencyTarget(formData);
        toast.success("Target updated");
        setOpen(false);
      } catch (e) { toast.error((e as Error).message); }
    });
  };

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 grid place-items-center rounded-md bg-positive/15 text-positive">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Emergency fund</div>
              <div className="text-xs text-muted-fg">
                {target > 0
                  ? done
                    ? "Goal reached"
                    : `${pct}% there · ${remaining > 0 ? "" : ""}`
                  : "Set a target to start tracking"}
              </div>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-fg hover:text-foreground hover:bg-surface-2 transition"
              >
                <Pencil className="size-3" /> Target
              </button>
            </DialogTrigger>
            <DialogContent title="Set emergency fund target" description="The amount you want to keep stashed for emergencies.">
              <form action={onSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ef_target">Target (₹)</Label>
                  <Input
                    id="ef_target"
                    name="target"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={paiseToRupees(target).toString()}
                    required
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-fg">Tip: 6× your monthly spend is a healthy benchmark.</p>
                </div>
                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? "Saving…" : "Save target"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <Amount paise={saved} className="text-2xl" tone={done ? "positive" : "default"} />
          <div className="text-xs text-muted-fg">
            of <Amount paise={target} className="text-xs" />
          </div>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full transition-all ${done ? "bg-positive" : "bg-foreground/80"}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {target > 0 && !done && (
          <div className="mt-2 text-[11px] text-muted-fg">
            <Amount paise={remaining} className="text-[11px]" /> to go
          </div>
        )}
        {target === 0 && (
          <div className="mt-2 text-[11px] text-muted-fg">
            Tag any investment as &quot;emergency fund&quot; below and it&apos;ll count here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
