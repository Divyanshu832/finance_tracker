"use client";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateVenture } from "@/actions/ventures";

export function EditVentureDialog({
  venture,
}: {
  venture: {
    id: string; name: string; description: string | null;
    my_percentage: number; started_on: string; notes: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const onSubmit = (formData: FormData) => {
    formData.set("id", venture.id);
    start(async () => {
      try {
        await updateVenture(formData);
        toast.success("Venture updated");
        setOpen(false);
      } catch (e) { toast.error((e as Error).message); }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" title="Edit venture"
          className="size-9 grid place-items-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-2 transition">
          <Pencil className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent title="Edit venture">
        <form action={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="v_name">Name</Label>
            <Input id="v_name" name="name" defaultValue={venture.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="v_my_percentage">Your %</Label>
              <Input id="v_my_percentage" name="my_percentage" type="number" step="0.01" min="0" max="100"
                defaultValue={venture.my_percentage} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v_started_on">Started</Label>
              <Input id="v_started_on" name="started_on" type="date" defaultValue={venture.started_on} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v_description">Description</Label>
            <Textarea id="v_description" name="description" defaultValue={venture.description ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v_notes">Notes</Label>
            <Textarea id="v_notes" name="notes" defaultValue={venture.notes ?? ""} />
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save changes"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
