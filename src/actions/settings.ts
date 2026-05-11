"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";

const EmergencyFund = z.object({
  target: z.coerce.number().min(0),
  saved: z.coerce.number().min(0),
});

export async function setEmergencyFund(formData: FormData) {
  const { target, saved } = EmergencyFund.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const now = new Date().toISOString();
  const { error } = await sb.from("app_settings").upsert([
    { key: "emergency_fund_target_paise", value: String(rupeesToPaise(target)), updated_at: now },
    { key: "emergency_fund_saved_paise", value: String(rupeesToPaise(saved)), updated_at: now },
  ]);
  if (error) throw new Error(error.message);
  revalidatePath("/investments");
  revalidatePath("/");
}
