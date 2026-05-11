"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";
import { monthCycle, todayISO } from "@/lib/dates";

const Bill = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["emi", "credit_card", "loan", "other"]),
  amount: z.coerce.number().positive(),
  due_day: z.coerce.number().int().min(1).max(31),
  start_on: z.string().min(10),
  end_on: z.string().optional().nullable().or(z.literal("")),
  autopay: z.coerce.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export async function addBill(formData: FormData) {
  const input = Bill.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { error } = await sb.from("bills").insert({
    name: input.name,
    type: input.type,
    amount: rupeesToPaise(input.amount),
    due_day: input.due_day,
    start_on: input.start_on,
    end_on: input.end_on ? input.end_on : null,
    autopay: !!input.autopay,
    notes: input.notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/bills");
  revalidatePath("/");
}

export async function deleteBill(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from("bills").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bills");
  revalidatePath("/");
}

export async function payBill(billId: string, amountRupees?: number) {
  const sb = getSupabase();
  const { data: bill } = await sb.from("bills").select("*").eq("id", billId).single();
  if (!bill) throw new Error("Bill not found");
  const { cycleMonth } = monthCycle();
  const amount = amountRupees != null ? rupeesToPaise(amountRupees) : bill.amount;
  const { error } = await sb.from("bill_payments").insert({
    bill_id: billId,
    amount,
    paid_on: todayISO(),
    cycle_month: cycleMonth,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/bills");
  revalidatePath("/");
}

export async function undoPay(paymentId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("bill_payments").delete().eq("id", paymentId);
  if (error) throw new Error(error.message);
  revalidatePath("/bills");
  revalidatePath("/");
}

const BillUpdate = Bill.extend({ id: z.string().uuid() });

export async function updateBill(formData: FormData) {
  const input = BillUpdate.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { error } = await sb.from("bills").update({
    name: input.name,
    type: input.type,
    amount: rupeesToPaise(input.amount),
    due_day: input.due_day,
    start_on: input.start_on,
    end_on: input.end_on ? input.end_on : null,
    autopay: !!input.autopay,
    notes: input.notes || null,
  }).eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/bills");
  revalidatePath("/");
}
