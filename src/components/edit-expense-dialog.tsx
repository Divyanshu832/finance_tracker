"use client";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateExpense } from "@/actions/expenses";
import { paiseToRupees } from "@/lib/money";

type Category = { id: string; name: string };

export function EditExpenseDialog({
  expense,
  categories,
}: {
  expense: {
    id: string;
    amount: number;
    category_id: string | null;
    description: string;
    occurred_on: string;
  };
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const onSubmit = (formData: FormData) => {
    formData.set("id", expense.id);
    start(async () => {
      try {
        await updateExpense(formData);
        toast.success("Expense updated");
        setOpen(false);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Edit"
          className="size-8 grid place-items-center rounded-md text-muted-fg hover:bg-surface-2 hover:text-foreground transition"
        >
          <Pencil className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent title="Edit expense">
        <form action={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="e_description">Description</Label>
            <Input
              id="e_description"
              name="description"
              defaultValue={expense.description}
              placeholder="What was this for?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="e_amount">Amount (₹)</Label>
              <Input
                id="e_amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={paiseToRupees(expense.amount).toString()}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e_occurred_on">Date</Label>
              <Input
                id="e_occurred_on"
                name="occurred_on"
                type="date"
                defaultValue={expense.occurred_on}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e_category_id">Category</Label>
            <Select
              id="e_category_id"
              name="category_id"
              defaultValue={expense.category_id ?? ""}
            >
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
