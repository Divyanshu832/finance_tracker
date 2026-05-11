"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";

const Income = z.object({
  amount: z.coerce.number().positive(),
  source: z.string().min(1).max(120),
  received_on: z.string().min(10),
  notes: z.string().max(500).optional().nullable(),
});

export async function addIncome(formData: FormData) {
  const input = Income.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { error } = await sb.from("incomes").insert({
    amount: rupeesToPaise(input.amount),
    source: input.source,
    received_on: input.received_on,
    notes: input.notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/income");
  revalidatePath("/");
}

export async function deleteIncome(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from("incomes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/income");
  revalidatePath("/");
}

const IncomeUpdate = Income.extend({ id: z.string().uuid() });

export async function updateIncome(formData: FormData) {
  const input = IncomeUpdate.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { error } = await sb.from("incomes").update({
    amount: rupeesToPaise(input.amount),
    source: input.source,
    received_on: input.received_on,
    notes: input.notes || null,
  }).eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/income");
  revalidatePath("/");
}
