"use client";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateSubscription } from "@/actions/subscriptions";
import { paiseToRupees } from "@/lib/money";

export function EditSubscriptionDialog({
  sub,
  categories,
}: {
  sub: {
    id: string; name: string; amount_inr: number; native_currency: string;
    billing_day: number; category_id: string | null;
  };
  categories: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const onSubmit = (formData: FormData) => {
    formData.set("id", sub.id);
    start(async () => {
      try {
        await updateSubscription(formData);
        toast.success("Subscription updated");
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
      <DialogContent title="Edit subscription">
        <form action={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="s_name">Name</Label>
            <Input id="s_name" name="name" defaultValue={sub.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s_amount_inr">Amount (₹)</Label>
              <Input id="s_amount_inr" name="amount_inr" type="number" step="0.01" min="0"
                defaultValue={paiseToRupees(sub.amount_inr).toString()} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s_billing_day">Billing day</Label>
              <Input id="s_billing_day" name="billing_day" type="number" min="1" max="31" defaultValue={sub.billing_day} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s_native_currency">Currency</Label>
              <Input id="s_native_currency" name="native_currency" defaultValue={sub.native_currency} maxLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s_category_id">Category</Label>
              <Select id="s_category_id" name="category_id" defaultValue={sub.category_id ?? ""}>
                <option value="">Subscriptions</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save changes"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
