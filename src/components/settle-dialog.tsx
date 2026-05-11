"use client";
import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { paiseToRupees } from "@/lib/money";

export function SettleDialog({
  lendingId,
  outstanding,
  direction,
  settle,
}: {
  lendingId: string;
  outstanding: number; // paise
  direction: "lent" | "borrowed";
  settle: (id: string, rupees: number, settledOn: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState(paiseToRupees(outstanding).toString());
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const onSubmit = () => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return toast.error("Enter a valid amount");
    start(async () => {
      try {
        await settle(lendingId, n, date);
        toast.success(direction === "lent" ? "Marked as received" : "Marked as paid back");
        setOpen(false);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">{direction === "lent" ? "Received" : "Paid back"}</Button>
      </DialogTrigger>
      <DialogContent title={direction === "lent" ? "Receive payment" : "Settle payment"}>
        <div className="space-y-3">
          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <Button onClick={onSubmit} disabled={pending} className="w-full">
            {pending ? "Saving…" : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
