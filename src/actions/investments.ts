"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";

const Investment = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["mf", "stock", "fd", "rd", "gold", "crypto", "other"]),
  platform: z.string().optional().nullable(),
  amount: z.coerce.number().positive(),
  invested_on: z.string().min(10),
  notes: z.string().optional().nullable(),
  counts_toward_emergency: z.coerce.boolean().optional().default(false),
});

export async function addInvestment(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const input = Investment.parse({
    ...raw,
    counts_toward_emergency: raw.counts_toward_emergency === "on" || raw.counts_toward_emergency === "true",
  });
  const sb = getSupabase();
  const { error } = await sb.from("investments").insert({
    name: input.name,
    type: input.type,
    platform: input.platform || null,
    amount: rupeesToPaise(input.amount),
    invested_on: input.invested_on,
    notes: input.notes || null,
    counts_toward_emergency: input.counts_toward_emergency,
  });
  if (error) throw new Error(error.message);
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
  const raw = Object.fromEntries(formData);
  const input = InvestmentUpdate.parse({
    ...raw,
    counts_toward_emergency: raw.counts_toward_emergency === "on" || raw.counts_toward_emergency === "true",
  });
  const sb = getSupabase();
  const { error } = await sb.from("investments").update({
    name: input.name,
    type: input.type,
    platform: input.platform || null,
    amount: rupeesToPaise(input.amount),
    invested_on: input.invested_on,
    notes: input.notes || null,
    counts_toward_emergency: input.counts_toward_emergency,
  }).eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/investments");
  revalidatePath("/");
}
