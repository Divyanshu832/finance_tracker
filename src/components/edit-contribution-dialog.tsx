"use client";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateContribution } from "@/actions/ventures";
import { paiseToRupees } from "@/lib/money";

export function EditContributionDialog({
  contribution,
  ventureId,
  participants,
}: {
  contribution: {
    id: string; contributor_kind: "me" | "participant";
    participant_id: string | null; amount: number; contributed_on: string;
  };
  ventureId: string;
  participants: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const defaultContrib = contribution.contributor_kind === "me" ? "me" : contribution.participant_id ?? "me";

  const onSubmit = (formData: FormData) => {
    formData.set("id", contribution.id);
    formData.set("venture_id", ventureId);
    start(async () => {
      try {
        await updateContribution(formData);
        toast.success("Contribution updated");
        setOpen(false);
      } catch (e) { toast.error((e as Error).message); }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" title="Edit contribution"
          className="size-8 grid place-items-center rounded-md text-muted-fg hover:bg-surface-2 hover:text-foreground transition">
          <Pencil className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent
        title="Edit contribution"
        description="Note: auto-lending recalculates only on add/delete. To re-trigger reconciliation after an edit, delete and re-add this row."
      >
        <form action={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ce_contributor">Who paid</Label>
              <Select id="ce_contributor" name="contributor" defaultValue={defaultContrib} required>
                <option value="me">You</option>
                {participants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ce_amount">Amount (₹)</Label>
              <Input id="ce_amount" name="amount" type="number" step="0.01" min="0"
                defaultValue={paiseToRupees(contribution.amount).toString()} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ce_contributed_on">Date</Label>
            <Input id="ce_contributed_on" name="contributed_on" type="date" defaultValue={contribution.contributed_on} required />
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save changes"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
