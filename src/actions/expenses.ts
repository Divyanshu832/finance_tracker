"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";

const Expense = z.object({
  amount: z.coerce.number().positive(),
  category_id: z.string().uuid().optional().nullable().or(z.literal("")),
  description: z.string().max(500).optional().nullable(),
  occurred_on: z.string().min(10),
});

export async function addExpense(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const input = Expense.parse(raw);
  const sb = getSupabase();
  const { error } = await sb.from("expenses").insert({
    amount: rupeesToPaise(input.amount),
    category_id: input.category_id ? input.category_id : null,
    description: (input.description ?? "").toString(),
    occurred_on: input.occurred_on,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
  revalidatePath("/");
}

export async function deleteExpense(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
  revalidatePath("/");
}

export async function updateExpenseAmount(id: string, rupees: number) {
  const sb = getSupabase();
  const { error } = await sb.from("expenses").update({ amount: rupeesToPaise(rupees) }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
  revalidatePath("/");
}

const ExpenseUpdate = z.object({
  id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  category_id: z.string().uuid().optional().nullable().or(z.literal("")),
  description: z.string().max(500).optional().nullable(),
  occurred_on: z.string().min(10),
});

export async function updateExpense(formData: FormData) {
  const input = ExpenseUpdate.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { error } = await sb.from("expenses").update({
    amount: rupeesToPaise(input.amount),
    category_id: input.category_id ? input.category_id : null,
    description: (input.description ?? "").toString(),
    occurred_on: input.occurred_on,
  }).eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
  revalidatePath("/");
}
