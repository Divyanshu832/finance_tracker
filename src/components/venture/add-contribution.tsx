"use client";
import { useState, useTransition } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatINR } from "@/lib/money";
import { addContribution } from "@/actions/ventures";

type Participant = { id: string; name: string };

export function AddContributionForm({
  ventureId,
  participants,
}: {
  ventureId: string;
  participants: Participant[];
}) {
  const [pending, start] = useTransition();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const onSubmit = (formData: FormData) => {
    formData.set("venture_id", ventureId);
    start(async () => {
      try {
        const res = await addContribution(formData);
        if (res.autoLending) {
          const direction = res.autoLending.direction === "lent" ? "Owed by" : "Borrowed from";
          toast.success(
            `Auto-created: ${direction} ${res.autoLending.counterparty} · ${formatINR(res.autoLending.amount)}`,
            { icon: <Sparkles className="size-4 text-warning" /> }
          );
        } else {
          toast.success("Contribution recorded");
        }
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="contributor">Who paid</Label>
          <Select id="contributor" name="contributor" defaultValue="me" required>
            <option value="me">You</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contributed_on">Date</Label>
        <Input
          id="contributed_on"
          name="contributed_on"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        <Plus className="size-4" /> {pending ? "Recording…" : "Record contribution"}
      </Button>
    </form>
  );
}
