import { getSupabase } from "@/lib/supabase/server";
import type {
  Income, Expense, ExpenseCategory, Bill, BillPayment,
  Subscription, Venture, VentureParticipant, VentureContribution,
  Lending, LendingSettlement, Investment,
} from "@/lib/supabase/types";

export async function getBalance(): Promise<number> {
  const sb = getSupabase();
  const { data, error } = await sb.from("v_balance").select("balance_paise").single();
  if (error || !data) return 0;
  return Number(data.balance_paise) || 0;
}

export async function getCategories(): Promise<ExpenseCategory[]> {
  const sb = getSupabase();
  const { data } = await sb.from("expense_categories").select("*").order("name");
  return data ?? [];
}

export async function getIncomes(): Promise<Income[]> {
  const sb = getSupabase();
  const { data } = await sb.from("incomes").select("*").order("received_on", { ascending: false });
  return data ?? [];
}

export async function getExpenses(): Promise<Expense[]> {
  const sb = getSupabase();
  const { data } = await sb.from("expenses").select("*").order("occurred_on", { ascending: false });
  return data ?? [];
}

export async function getBills(): Promise<Bill[]> {
  const sb = getSupabase();
  const { data } = await sb.from("bills").select("*").order("due_day");
  return data ?? [];
}

export async function getBillPayments(): Promise<BillPayment[]> {
  const sb = getSupabase();
  const { data } = await sb.from("bill_payments").select("*").order("paid_on", { ascending: false });
  return data ?? [];
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const sb = getSupabase();
  const { data } = await sb.from("subscriptions").select("*").order("billing_day");
  return data ?? [];
}

export async function getVentures(): Promise<Venture[]> {
  const sb = getSupabase();
  const { data } = await sb.from("ventures").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getVenture(id: string) {
  const sb = getSupabase();
  const [venture, participants, contributions, lendings] = await Promise.all([
    sb.from("ventures").select("*").eq("id", id).single(),
    sb.from("venture_participants").select("*").eq("venture_id", id).order("created_at"),
    sb.from("venture_contributions").select("*").eq("venture_id", id).order("contributed_on", { ascending: false }),
    sb.from("lendings").select("*").eq("venture_id", id).order("created_at", { ascending: false }),
  ]);
  return {
    venture: venture.data as Venture | null,
    participants: (participants.data ?? []) as VentureParticipant[],
    contributions: (contributions.data ?? []) as VentureContribution[],
    lendings: (lendings.data ?? []) as Lending[],
  };
}

export async function getLendings(): Promise<Lending[]> {
  const sb = getSupabase();
  const { data } = await sb.from("lendings").select("*").order("occurred_on", { ascending: false });
  return data ?? [];
}

export async function getSettlements(): Promise<LendingSettlement[]> {
  const sb = getSupabase();
  const { data } = await sb.from("lending_settlements").select("*").order("settled_on", { ascending: false });
  return data ?? [];
}

export async function getInvestments(): Promise<Investment[]> {
  const sb = getSupabase();
  const { data } = await sb.from("investments").select("*").order("invested_on", { ascending: false });
  return data ?? [];
}

// Outstanding amount for a single lending (amount - sum(settlements))
export function outstanding(lending: Lending, settlements: LendingSettlement[]): number {
  const paid = settlements.filter((s) => s.lending_id === lending.id).reduce((s, x) => s + x.amount, 0);
  return Math.max(0, lending.amount - paid);
}

export async function getEmergencyFund(): Promise<{ target: number; saved: number }> {
  const sb = getSupabase();
  const { data } = await sb.from("app_settings")
    .select("key, value")
    .in("key", ["emergency_fund_target_paise", "emergency_fund_saved_paise"]);
  const map = new Map((data ?? []).map((r) => [r.key, Number(r.value) || 0]));
  return {
    target: map.get("emergency_fund_target_paise") ?? 0,
    saved: map.get("emergency_fund_saved_paise") ?? 0,
  };
}
