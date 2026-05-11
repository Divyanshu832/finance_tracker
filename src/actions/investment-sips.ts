"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { format, startOfMonth } from "date-fns";
import { getSupabase } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";

const Sip = z.object({
  investment_id: z.string().uuid(),
  monthly_amount: z.coerce.number().positive(),
  sip_day: z.coerce.number().int().min(1).max(31),
  start_on: z.string().min(10),
  end_on: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createSip(formData: FormData) {
  const input = Sip.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { error } = await sb.from("investment_sips").insert({
    investment_id: input.investment_id,
    monthly_amount: rupeesToPaise(input.monthly_amount),
    sip_day: input.sip_day,
    start_on: input.start_on,
    end_on: input.end_on || null,
    notes: input.notes || null,
    active: true,
  });
  if (error) throw new Error(error.message);

  // Catch up: if today is past the SIP day in the start month (or later),
  // generate the missed installments straight away.
  await processDueSips();

  revalidatePath(`/investments/${input.investment_id}`);
  revalidatePath("/investments");
  revalidatePath("/");
}

export async function toggleSip(id: string, active: boolean, investmentId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("investment_sips").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/investments/${investmentId}`);
  revalidatePath("/investments");
}

export async function deleteSip(id: string, investmentId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("investment_sips").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/investments/${investmentId}`);
  revalidatePath("/investments");
  revalidatePath("/");
}

const SipUpdate = Sip.extend({ id: z.string().uuid() });

export async function updateSip(formData: FormData) {
  const input = SipUpdate.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { error } = await sb.from("investment_sips").update({
    monthly_amount: rupeesToPaise(input.monthly_amount),
    sip_day: input.sip_day,
    start_on: input.start_on,
    end_on: input.end_on || null,
    notes: input.notes || null,
  }).eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/investments/${input.investment_id}`);
  revalidatePath("/investments");
  revalidatePath("/");
}

// Idempotent: for each active SIP whose sip_day has passed this month and
// start_on is in the past (or today), insert one transaction for the cycle
// and stamp last_charged_on. Mirrors processDueSubscriptions.
export async function processDueSips(): Promise<{ created: number }> {
  const sb = getSupabase();
  const today = new Date();
  const day = today.getDate();
  const cycleStart = format(startOfMonth(today), "yyyy-MM-01");
  const todayIso = format(today, "yyyy-MM-dd");

  const { data: sips, error } = await sb.from("investment_sips").select("*").eq("active", true);
  if (error) throw new Error(error.message);

  let created = 0;
  for (const s of sips ?? []) {
    if (s.start_on > todayIso) continue;
    if (s.end_on && s.end_on < todayIso) continue;
    if (s.sip_day > day) continue;
    if (s.last_charged_on && s.last_charged_on >= cycleStart) continue;

    const dueDay = Math.min(s.sip_day, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate());
    const occurredOn = format(new Date(today.getFullYear(), today.getMonth(), dueDay), "yyyy-MM-dd");

    const { error: insErr } = await sb.from("investment_transactions").insert({
      investment_id: s.investment_id,
      amount: s.monthly_amount,
      occurred_on: occurredOn,
      sip_id: s.id,
    });
    if (insErr) continue;
    await sb.from("investment_sips").update({ last_charged_on: todayIso }).eq("id", s.id);
    created++;
  }
  return { created };
}
