"use client";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateIncome } from "@/actions/income";
import { paiseToRupees } from "@/lib/money";

export function EditIncomeDialog({
  income,
}: {
  income: { id: string; source: string; amount: number; received_on: string; notes: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const onSubmit = (formData: FormData) => {
    formData.set("id", income.id);
    start(async () => {
      try {
        await updateIncome(formData);
        toast.success("Income updated");
        setOpen(false);
      } catch (e) { toast.error((e as Error).message); }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" title="Edit"
          className="size-8 grid place-items-center rounded-md text-muted-fg hover:bg-surface-2 hover:text-foreground transition">
          <Pencil className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent title="Edit income">
        <form action={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="i_source">Source</Label>
            <Input id="i_source" name="source" defaultValue={income.source} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="i_amount">Amount (₹)</Label>
              <Input id="i_amount" name="amount" type="number" step="0.01" min="0"
                defaultValue={paiseToRupees(income.amount).toString()} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i_received_on">Date</Label>
              <Input id="i_received_on" name="received_on" type="date" defaultValue={income.received_on} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i_notes">Notes</Label>
            <Textarea id="i_notes" name="notes" defaultValue={income.notes ?? ""} />
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save changes"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
