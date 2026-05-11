"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";

const Target = z.object({
  target: z.coerce.number().min(0),
});

export async function setEmergencyTarget(formData: FormData) {
  const { target } = Target.parse(Object.fromEntries(formData));
  const sb = getSupabase();
  const { error } = await sb.from("app_settings").upsert({
    key: "emergency_fund_target_paise",
    value: String(rupeesToPaise(target)),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/investments");
  revalidatePath("/");
}
