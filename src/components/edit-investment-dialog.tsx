"use client";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateInvestment } from "@/actions/investments";
import { paiseToRupees } from "@/lib/money";

const TYPE_LABELS: Record<string, string> = {
  mf: "Mutual Fund", stock: "Stock", fd: "FD", rd: "RD",
  gold: "Gold", crypto: "Crypto", other: "Other",
};

export function EditInvestmentDialog({
  investment,
}: {
  investment: {
    id: string; name: string; type: string; platform: string | null;
    amount: number; invested_on: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const onSubmit = (formData: FormData) => {
    formData.set("id", investment.id);
    start(async () => {
      try {
        await updateInvestment(formData);
        toast.success("Investment updated");
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
      <DialogContent title="Edit investment">
        <form action={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="inv_name">Name</Label>
            <Input id="inv_name" name="name" defaultValue={investment.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inv_type">Type</Label>
              <Select id="inv_type" name="type" defaultValue={investment.type}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv_platform">Platform</Label>
              <Input id="inv_platform" name="platform" defaultValue={investment.platform ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inv_amount">Amount (₹)</Label>
              <Input id="inv_amount" name="amount" type="number" step="0.01" min="0"
                defaultValue={paiseToRupees(investment.amount).toString()} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv_invested_on">Date</Label>
              <Input id="inv_invested_on" name="invested_on" type="date" defaultValue={investment.invested_on} required />
            </div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save changes"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
