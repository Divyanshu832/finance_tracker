"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";
import { format, startOfMonth } from "date-fns";

const Subscription = z.object({
  name: z.string().min(1).max(120),
  amount_inr: z.coerce.number().positive(),
  native_currency: z.string().min(1).max(8).default("INR"),
  billing_day: z.coerce.number().int().min(1).max(31),
  category_id: z.string().uuid().optional().nullable().or(z.literal("")),
  icon: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function addSubscription(formData: FormData) {
  const input = Subscription.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { error } = await sb.from("subscriptions").insert({
    name: input.name,
    amount_inr: rupeesToPaise(input.amount_inr),
    native_currency: input.native_currency,
    billing_day: input.billing_day,
    category_id: input.category_id ? input.category_id : null,
    icon: input.icon || "repeat",
    notes: input.notes || null,
    active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/subscriptions");
  revalidatePath("/");
}

export async function toggleSubscription(id: string, active: boolean) {
  const sb = getSupabase();
  const { error } = await sb.from("subscriptions").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/subscriptions");
}

export async function deleteSubscription(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from("subscriptions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/subscriptions");
}

export async function updateSubscriptionAmount(id: string, rupees: number) {
  const sb = getSupabase();
  const { error } = await sb.from("subscriptions").update({ amount_inr: rupeesToPaise(rupees) }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/subscriptions");
}

const SubUpdate = Subscription.extend({ id: z.string().uuid() });

export async function updateSubscription(formData: FormData) {
  const input = SubUpdate.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { error } = await sb.from("subscriptions").update({
    name: input.name,
    amount_inr: rupeesToPaise(input.amount_inr),
    native_currency: input.native_currency,
    billing_day: input.billing_day,
    category_id: input.category_id ? input.category_id : null,
    icon: input.icon || "repeat",
    notes: input.notes || null,
  }).eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/subscriptions");
  revalidatePath("/");
}

// Idempotent: for each active subscription, if not yet charged this month and
// billing_day <= today's day, create the expense.
export async function processDueSubscriptions(): Promise<{ created: number }> {
  const sb = getSupabase();
  const today = new Date();
  const day = today.getDate();
  const cycle = format(startOfMonth(today), "yyyy-MM-01");
  const todayIso = format(today, "yyyy-MM-dd");

  const { data: subs, error } = await sb.from("subscriptions").select("*").eq("active", true);
  if (error) throw new Error(error.message);

  let created = 0;
  for (const s of subs ?? []) {
    if (s.billing_day > day) continue;
    if (s.last_charged_on && s.last_charged_on >= cycle) continue;
    const dueDay = Math.min(s.billing_day, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate());
    const occurredOn = format(new Date(today.getFullYear(), today.getMonth(), dueDay), "yyyy-MM-dd");

    const { error: insErr } = await sb.from("expenses").insert({
      amount: s.amount_inr,
      category_id: s.category_id,
      description: `${s.name} subscription`,
      occurred_on: occurredOn,
      subscription_id: s.id,
    });
    if (insErr) continue;
    await sb.from("subscriptions").update({ last_charged_on: todayIso }).eq("id", s.id);
    created++;
  }

  revalidatePath("/expenses");
  revalidatePath("/subscriptions");
  revalidatePath("/");
  return { created };
}
