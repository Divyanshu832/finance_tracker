"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";

const Lumpsum = z.object({
  investment_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  occurred_on: z.string().min(10),
  notes: z.string().optional().nullable(),
});

export async function addLumpsum(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const input = Lumpsum.parse(raw);
  const excluded = raw.excluded_from_balance === "on" || raw.excluded_from_balance === "true";
  const sb = getSupabase();
  const { error } = await sb.from("investment_transactions").insert({
    investment_id: input.investment_id,
    amount: rupeesToPaise(input.amount),
    occurred_on: input.occurred_on,
    excluded_from_balance: excluded,
    notes: input.notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/investments/${input.investment_id}`);
  revalidatePath("/investments");
  revalidatePath("/");
}

export async function toggleTransactionExcluded(id: string, excluded: boolean, investmentId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("investment_transactions")
    .update({ excluded_from_balance: excluded })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/investments/${investmentId}`);
  revalidatePath("/investments");
  revalidatePath("/");
}

export async function deleteTransaction(id: string, investmentId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("investment_transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/investments/${investmentId}`);
  revalidatePath("/investments");
  revalidatePath("/");
}

const TxUpdate = Lumpsum.extend({ id: z.string().uuid() });

export async function updateTransaction(formData: FormData) {
  const input = TxUpdate.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { error } = await sb.from("investment_transactions").update({
    amount: rupeesToPaise(input.amount),
    occurred_on: input.occurred_on,
    notes: input.notes || null,
  }).eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/investments/${input.investment_id}`);
  revalidatePath("/investments");
  revalidatePath("/");
}
