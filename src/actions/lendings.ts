"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";
import { todayISO } from "@/lib/dates";

const Lending = z.object({
  counterparty: z.string().min(1).max(120),
  direction: z.enum(["lent", "borrowed"]),
  amount: z.coerce.number().positive(),
  occurred_on: z.string().min(10),
  notes: z.string().optional().nullable(),
});

export async function addLending(formData: FormData) {
  const input = Lending.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { error } = await sb.from("lendings").insert({
    counterparty: input.counterparty,
    direction: input.direction,
    amount: rupeesToPaise(input.amount),
    occurred_on: input.occurred_on,
    source: "manual",
    notes: input.notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/lending");
  revalidatePath("/");
}

export async function deleteLending(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from("lendings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/lending");
  revalidatePath("/");
}

export async function settleLending(id: string, rupees: number, settledOn?: string) {
  const sb = getSupabase();
  const { error } = await sb.from("lending_settlements").insert({
    lending_id: id,
    amount: rupeesToPaise(rupees),
    settled_on: settledOn || todayISO(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/lending");
  revalidatePath("/ventures");
  revalidatePath("/");
}

export async function undoSettlement(settlementId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("lending_settlements").delete().eq("id", settlementId);
  if (error) throw new Error(error.message);
  revalidatePath("/lending");
  revalidatePath("/");
}

const LendingUpdate = Lending.extend({ id: z.string().uuid() });

export async function updateLending(formData: FormData) {
  const input = LendingUpdate.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  // Don't allow editing the direction of a venture_auto lending (trigger owns those).
  const { data: cur } = await sb.from("lendings").select("source").eq("id", input.id).single();
  const isAuto = cur?.source === "venture_auto";
  const patch: Record<string, unknown> = {
    counterparty: input.counterparty,
    amount: rupeesToPaise(input.amount),
    occurred_on: input.occurred_on,
    notes: input.notes || null,
  };
  if (!isAuto) patch.direction = input.direction;
  const { error } = await sb.from("lendings").update(patch).eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/lending");
  revalidatePath("/");
}
