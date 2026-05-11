"use client";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateLending } from "@/actions/lendings";
import { paiseToRupees } from "@/lib/money";

export function EditLendingDialog({
  lending,
}: {
  lending: {
    id: string; counterparty: string; direction: "lent" | "borrowed";
    amount: number; occurred_on: string; notes: string | null;
    source: "manual" | "venture_auto";
  };
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const isAuto = lending.source === "venture_auto";

  const onSubmit = (formData: FormData) => {
    formData.set("id", lending.id);
    start(async () => {
      try {
        await updateLending(formData);
        toast.success("Lending updated");
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
      <DialogContent title="Edit lending" description={isAuto ? "Auto-created from a venture — direction is locked." : undefined}>
        <form action={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="l_counterparty">Person</Label>
            <Input id="l_counterparty" name="counterparty" defaultValue={lending.counterparty} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="l_direction">Direction</Label>
              <Select id="l_direction" name="direction" defaultValue={lending.direction} disabled={isAuto}>
                <option value="lent">You lent</option>
                <option value="borrowed">You borrowed</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l_amount">Amount (₹)</Label>
              <Input id="l_amount" name="amount" type="number" step="0.01" min="0"
                defaultValue={paiseToRupees(lending.amount).toString()} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="l_occurred_on">Date</Label>
            <Input id="l_occurred_on" name="occurred_on" type="date" defaultValue={lending.occurred_on} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="l_notes">Notes</Label>
            <Textarea id="l_notes" name="notes" defaultValue={lending.notes ?? ""} />
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save changes"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
