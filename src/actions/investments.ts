"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";

const Investment = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["mf", "stock", "fd", "rd", "gold", "crypto", "other"]),
  platform: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Optional initial lumpsum at creation time — keeps "I just bought ₹X today"
// from being a two-step flow.
const InvestmentWithSeed = Investment.extend({
  initial_amount: z.coerce.number().min(0).optional(),
  initial_date: z.string().optional(),
});

export async function addInvestment(formData: FormData) {
  const input = InvestmentWithSeed.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { data: created, error } = await sb.from("investments").insert({
    name: input.name,
    type: input.type,
    platform: input.platform || null,
    notes: input.notes || null,
  }).select("id").single();
  if (error || !created) throw new Error(error?.message ?? "Insert failed");

  if (input.initial_amount && input.initial_amount > 0 && input.initial_date) {
    const { error: txErr } = await sb.from("investment_transactions").insert({
      investment_id: created.id,
      amount: rupeesToPaise(input.initial_amount),
      occurred_on: input.initial_date,
    });
    if (txErr) throw new Error(txErr.message);
  }
  revalidatePath("/investments");
  revalidatePath("/");
}

export async function deleteInvestment(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from("investments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/investments");
  revalidatePath("/");
}

const InvestmentUpdate = Investment.extend({ id: z.string().uuid() });

export async function updateInvestment(formData: FormData) {
  const input = InvestmentUpdate.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { error } = await sb.from("investments").update({
    name: input.name,
    type: input.type,
    platform: input.platform || null,
    notes: input.notes || null,
  }).eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/investments");
  revalidatePath(`/investments/${input.id}`);
  revalidatePath("/");
}
