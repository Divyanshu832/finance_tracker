import { format, parseISO, startOfMonth, endOfMonth, addDays, isWithinInterval } from "date-fns";

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function fmtDate(iso: string | null | undefined, pattern = "d MMM yyyy"): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}

export function monthCycle(date = new Date()) {
  return {
    start: format(startOfMonth(date), "yyyy-MM-dd"),
    end: format(endOfMonth(date), "yyyy-MM-dd"),
    cycleMonth: format(startOfMonth(date), "yyyy-MM-01"),
  };
}

export function daysFromNow(iso: string): number {
  const d = parseISO(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function isWithinNextNDays(iso: string, n: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return isWithinInterval(parseISO(iso), { start: today, end: addDays(today, n) });
}

export function nextBillingDate(billing_day: number, ref = new Date()): Date {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const d = Math.min(billing_day, lastDay);
  const candidate = new Date(y, m, d);
  if (candidate < ref) {
    const nm = new Date(y, m + 1, 1);
    const lastDay2 = new Date(nm.getFullYear(), nm.getMonth() + 1, 0).getDate();
    return new Date(nm.getFullYear(), nm.getMonth(), Math.min(billing_day, lastDay2));
  }
  return candidate;
}
