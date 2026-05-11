import { addMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { getSupabase } from "@/lib/supabase/server";
import type { ExpenseCategory } from "@/lib/supabase/types";

export type MonthlyPoint = { month: string; label: string; income: number; spend: number; net: number };

// Last `months` months of income vs spend (expenses + bill payments + investments).
export async function getMonthlyTrend(months = 6): Promise<MonthlyPoint[]> {
  const sb = getSupabase();
  const end = new Date();
  const start = startOfMonth(addMonths(end, -(months - 1)));
  const startIso = format(start, "yyyy-MM-dd");

  const [{ data: incomes }, { data: expenses }, { data: payments }, { data: investments }] = await Promise.all([
    sb.from("incomes").select("amount, received_on").gte("received_on", startIso),
    sb.from("expenses").select("amount, occurred_on").gte("occurred_on", startIso),
    sb.from("bill_payments").select("amount, paid_on").gte("paid_on", startIso),
    sb.from("investments").select("amount, invested_on").gte("invested_on", startIso),
  ]);

  const points: MonthlyPoint[] = [];
  for (let i = 0; i < months; i++) {
    const d = addMonths(start, i);
    const ms = format(startOfMonth(d), "yyyy-MM-dd");
    const me = format(endOfMonth(d), "yyyy-MM-dd");
    const inSum = (incomes ?? []).filter((r) => r.received_on >= ms && r.received_on <= me).reduce((s, r) => s + Number(r.amount), 0);
    const exSum = (expenses ?? []).filter((r) => r.occurred_on >= ms && r.occurred_on <= me).reduce((s, r) => s + Number(r.amount), 0);
    const bpSum = (payments ?? []).filter((r) => r.paid_on >= ms && r.paid_on <= me).reduce((s, r) => s + Number(r.amount), 0);
    const ivSum = (investments ?? []).filter((r) => r.invested_on >= ms && r.invested_on <= me).reduce((s, r) => s + Number(r.amount), 0);
    points.push({
      month: format(d, "yyyy-MM"),
      label: format(d, "MMM"),
      income: inSum,
      spend: exSum + bpSum + ivSum,
      net: inSum - (exSum + bpSum + ivSum),
    });
  }
  return points;
}

export type CategorySlice = { id: string | "none"; name: string; amount: number; color: string };

// Category breakdown for the current month.
export async function getCategoryBreakdown(): Promise<CategorySlice[]> {
  const sb = getSupabase();
  const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const end = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const [{ data: expenses }, { data: cats }] = await Promise.all([
    sb.from("expenses").select("amount, category_id").gte("occurred_on", start).lte("occurred_on", end),
    sb.from("expense_categories").select("*"),
  ]);
  const catMap = new Map((cats as ExpenseCategory[] | null ?? []).map((c) => [c.id, c]));
  const buckets = new Map<string, number>();
  for (const e of (expenses ?? [])) {
    const k = e.category_id ?? "none";
    buckets.set(k, (buckets.get(k) ?? 0) + Number(e.amount));
  }
  const palette: Record<string, string> = {
    rose: "#fb7185", orange: "#fb923c", sky: "#38bdf8", amber: "#fcd34d",
    violet: "#a78bfa", emerald: "#34d399", fuchsia: "#e879f9", cyan: "#22d3ee", zinc: "#a1a1aa",
  };
  const slices: CategorySlice[] = [];
  for (const [k, amt] of buckets) {
    if (k === "none") slices.push({ id: "none", name: "Uncategorised", amount: amt, color: "#52525b" });
    else {
      const c = catMap.get(k);
      slices.push({ id: k, name: c?.name ?? "Unknown", amount: amt, color: palette[c?.color ?? "zinc"] ?? "#a1a1aa" });
    }
  }
  return slices.sort((a, b) => b.amount - a.amount);
}

export type ActivityItem = {
  id: string; kind: string; title: string; subtitle?: string;
  amount: number; tone: "positive" | "negative" | "neutral";
  date: string;
};

// Unified recent-activity feed across every domain.
export async function getRecentActivity(limit = 12): Promise<ActivityItem[]> {
  const sb = getSupabase();
  const [inc, exp, bp, inv, lend, sett, vc] = await Promise.all([
    sb.from("incomes").select("id, amount, source, received_on").order("created_at", { ascending: false }).limit(limit),
    sb.from("expenses").select("id, amount, description, occurred_on").order("created_at", { ascending: false }).limit(limit),
    sb.from("bill_payments").select("id, amount, paid_on, bill_id").order("created_at", { ascending: false }).limit(limit),
    sb.from("investments").select("id, amount, name, invested_on").order("created_at", { ascending: false }).limit(limit),
    sb.from("lendings").select("id, amount, counterparty, direction, occurred_on").order("created_at", { ascending: false }).limit(limit),
    sb.from("lending_settlements").select("id, amount, settled_on, lending_id").order("created_at", { ascending: false }).limit(limit),
    sb.from("venture_contributions").select("id, amount, contributed_on, contributor_kind, venture_id").order("created_at", { ascending: false }).limit(limit),
  ]);

  const items: ActivityItem[] = [];
  for (const r of inc.data ?? []) items.push({ id: r.id, kind: "income", title: r.source, amount: Number(r.amount), tone: "positive", date: r.received_on });
  for (const r of exp.data ?? []) items.push({ id: r.id, kind: "expense", title: r.description || "Expense", amount: Number(r.amount), tone: "negative", date: r.occurred_on });
  for (const r of bp.data ?? []) items.push({ id: r.id, kind: "bill", title: "Bill paid", amount: Number(r.amount), tone: "negative", date: r.paid_on });
  for (const r of inv.data ?? []) items.push({ id: r.id, kind: "investment", title: r.name, amount: Number(r.amount), tone: "neutral", date: r.invested_on });
  for (const r of lend.data ?? []) items.push({
    id: r.id, kind: "lending",
    title: r.direction === "lent" ? `Lent to ${r.counterparty}` : `Borrowed from ${r.counterparty}`,
    amount: Number(r.amount), tone: r.direction === "lent" ? "negative" : "positive", date: r.occurred_on,
  });
  for (const r of sett.data ?? []) items.push({ id: r.id, kind: "settlement", title: "Lending settled", amount: Number(r.amount), tone: "neutral", date: r.settled_on });
  for (const r of vc.data ?? []) items.push({
    id: r.id, kind: "contribution",
    title: r.contributor_kind === "me" ? "Your contribution to venture" : "Partner contributed to venture",
    amount: Number(r.amount), tone: r.contributor_kind === "me" ? "negative" : "neutral", date: r.contributed_on,
  });

  return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}
