"use client";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateBill } from "@/actions/bills";
import { paiseToRupees } from "@/lib/money";

export function EditBillDialog({
  bill,
}: {
  bill: {
    id: string; name: string; type: string; amount: number; due_day: number;
    start_on: string; end_on: string | null; autopay: boolean;
  };
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const onSubmit = (formData: FormData) => {
    formData.set("id", bill.id);
    start(async () => {
      try {
        await updateBill(formData);
        toast.success("Bill updated");
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
      <DialogContent title="Edit bill">
        <form action={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="b_name">Name</Label>
            <Input id="b_name" name="name" defaultValue={bill.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b_type">Type</Label>
              <Select id="b_type" name="type" defaultValue={bill.type}>
                <option value="emi">EMI</option>
                <option value="credit_card">Credit card</option>
                <option value="loan">Loan</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b_due_day">Due day</Label>
              <Input id="b_due_day" name="due_day" type="number" min="1" max="31" defaultValue={bill.due_day} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b_amount">Amount (₹)</Label>
              <Input id="b_amount" name="amount" type="number" step="0.01" min="0"
                defaultValue={paiseToRupees(bill.amount).toString()} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b_start_on">Starts</Label>
              <Input id="b_start_on" name="start_on" type="date" defaultValue={bill.start_on} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b_end_on">Ends (optional)</Label>
            <Input id="b_end_on" name="end_on" type="date" defaultValue={bill.end_on ?? ""} />
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save changes"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
