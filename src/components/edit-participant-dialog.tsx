"use client";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateParticipant } from "@/actions/ventures";

export function EditParticipantDialog({
  participant,
  ventureId,
}: {
  participant: { id: string; name: string; percentage: number };
  ventureId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const onSubmit = (formData: FormData) => {
    formData.set("id", participant.id);
    formData.set("venture_id", ventureId);
    start(async () => {
      try {
        await updateParticipant(formData);
        toast.success("Participant updated");
        setOpen(false);
      } catch (e) { toast.error((e as Error).message); }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" title="Edit participant"
          className="size-8 grid place-items-center rounded-md text-muted-fg hover:bg-surface-2 hover:text-foreground transition">
          <Pencil className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent title="Edit participant">
        <form action={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pe_name">Name</Label>
              <Input id="pe_name" name="name" defaultValue={participant.name} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pe_percentage">Share %</Label>
              <Input id="pe_percentage" name="percentage" type="number" step="0.01" min="0" max="100"
                defaultValue={participant.percentage} required />
            </div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save changes"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
