import { getSupabase } from "@/lib/supabase/server";
import type {
  Income, Expense, ExpenseCategory, Bill, BillPayment,
  Subscription, Venture, VentureParticipant, VentureContribution,
  Lending, LendingSettlement, Investment,
  InvestmentTransaction, InvestmentSip,
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
  const { data } = await sb.from("investments").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getInvestmentTransactions(): Promise<InvestmentTransaction[]> {
  const sb = getSupabase();
  const { data } = await sb.from("investment_transactions").select("*").order("occurred_on", { ascending: false });
  return data ?? [];
}

export type InvestmentWithStats = Investment & {
  total: number;
  txCount: number;
  activeSips: number;
  monthlySip: number;
  lastActivity: string | null;
};

export async function getInvestmentsWithStats(): Promise<InvestmentWithStats[]> {
  const sb = getSupabase();
  const [{ data: holdings }, { data: txs }, { data: sips }] = await Promise.all([
    sb.from("investments").select("*").order("created_at", { ascending: false }),
    sb.from("investment_transactions").select("investment_id, amount, occurred_on"),
    sb.from("investment_sips").select("investment_id, monthly_amount, active"),
  ]);

  return (holdings ?? []).map((h) => {
    const myTx = (txs ?? []).filter((t) => t.investment_id === h.id);
    const mySips = (sips ?? []).filter((s) => s.investment_id === h.id);
    const total = myTx.reduce((s, t) => s + t.amount, 0);
    const lastActivity = myTx.length
      ? myTx.map((t) => t.occurred_on).sort().reverse()[0]
      : null;
    const activeSips = mySips.filter((s) => s.active);
    return {
      ...h,
      total,
      txCount: myTx.length,
      activeSips: activeSips.length,
      monthlySip: activeSips.reduce((s, x) => s + x.monthly_amount, 0),
      lastActivity,
    };
  });
}

export async function getInvestment(id: string): Promise<{
  investment: Investment | null;
  transactions: InvestmentTransaction[];
  sips: InvestmentSip[];
}> {
  const sb = getSupabase();
  const [inv, txs, sips] = await Promise.all([
    sb.from("investments").select("*").eq("id", id).maybeSingle(),
    sb.from("investment_transactions").select("*").eq("investment_id", id).order("occurred_on", { ascending: false }),
    sb.from("investment_sips").select("*").eq("investment_id", id).order("created_at", { ascending: false }),
  ]);
  return {
    investment: (inv.data ?? null) as Investment | null,
    transactions: (txs.data ?? []) as InvestmentTransaction[],
    sips: (sips.data ?? []) as InvestmentSip[],
  };
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
