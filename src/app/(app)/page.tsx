import Link from "next/link";
import {
  Wallet, ArrowDownToLine, Receipt, CreditCard, Briefcase, HandCoins,
  Repeat, ArrowRight, ArrowUpRight, ArrowDownLeft, PiggyBank, TrendingUp,
  Activity as ActivityIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Amount } from "@/components/money/amount";
import { SpendTrendChart } from "@/components/charts/spend-trend";
import { CategoryDonut } from "@/components/charts/category-donut";
import { ActivityFeed } from "@/components/activity-feed";
import {
  getBalance, getBills, getBillPayments, getExpenses,
  getIncomes, getInvestmentTransactions, getLendings, getSettlements, getSubscriptions,
  getVentures, outstanding,
} from "@/lib/queries";
import { getMonthlyTrend, getCategoryBreakdown, getRecentActivity } from "@/lib/dashboard-data";
import { fmtDate, monthCycle, daysFromNow } from "@/lib/dates";
import { format, startOfMonth, addMonths } from "date-fns";
import { cn } from "@/lib/utils";

function nextDueDate(due_day: number): string {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const d = Math.min(due_day, lastDay);
  let candidate = new Date(today.getFullYear(), today.getMonth(), d);
  if (candidate < today) {
    const nm = addMonths(startOfMonth(today), 1);
    const lastDay2 = new Date(nm.getFullYear(), nm.getMonth() + 1, 0).getDate();
    candidate = new Date(nm.getFullYear(), nm.getMonth(), Math.min(due_day, lastDay2));
  }
  return format(candidate, "yyyy-MM-dd");
}

export default async function Dashboard() {
  const [
    balance, incomes, expenses, bills, payments, subs, ventures, lendings,
    settlements, investmentTxs, trend, categoryData, activity,
  ] = await Promise.all([
    getBalance(), getIncomes(), getExpenses(), getBills(), getBillPayments(),
    getSubscriptions(), getVentures(), getLendings(), getSettlements(), getInvestmentTransactions(),
    getMonthlyTrend(6), getCategoryBreakdown(), getRecentActivity(10),
  ]);

  const { start, end, cycleMonth } = monthCycle();
  const monthIncome = incomes.filter((i) => i.received_on >= start && i.received_on <= end).reduce((s, i) => s + i.amount, 0);
  const monthExpense = expenses.filter((e) => e.occurred_on >= start && e.occurred_on <= end).reduce((s, e) => s + e.amount, 0);
  const monthBillsPaid = payments.filter((p) => p.cycle_month === cycleMonth).reduce((s, p) => s + p.amount, 0);
  const monthInvest = investmentTxs
    .filter((t) => t.occurred_on >= start && t.occurred_on <= end && !t.excluded_from_balance)
    .reduce((s, t) => s + t.amount, 0);
  const monthOut = monthExpense + monthBillsPaid;
  const monthNet = monthIncome - monthOut - monthInvest;

  const paidBillIds = new Set(payments.filter((p) => p.cycle_month === cycleMonth).map((p) => p.bill_id));
  const upcomingBills = bills
    .filter((b) => !paidBillIds.has(b.id))
    .map((b) => ({ ...b, due_on: nextDueDate(b.due_day) }))
    .sort((a, b) => a.due_on.localeCompare(b.due_on))
    .slice(0, 5);

  const totalOwedToMe = lendings.filter((l) => l.direction === "lent").reduce((s, l) => s + outstanding(l, settlements), 0);
  const totalIOwe = lendings.filter((l) => l.direction === "borrowed").reduce((s, l) => s + outstanding(l, settlements), 0);
  const netLending = totalOwedToMe - totalIOwe;

  const activeVentures = ventures.filter((v) => v.status === "active").slice(0, 4);
  const activeSubs = subs.filter((s) => s.active);
  const subsThisWeek = activeSubs
    .map((s) => ({ ...s, due_on: nextDueDate(s.billing_day) }))
    .filter((s) => daysFromNow(s.due_on) >= 0 && daysFromNow(s.due_on) <= 7)
    .sort((a, b) => a.due_on.localeCompare(b.due_on));
  const investedTotal = investmentTxs.filter((t) => !t.excluded_from_balance).reduce((s, t) => s + t.amount, 0);
  const monthlySubBurn = activeSubs.reduce((s, x) => s + x.amount_inr, 0);

  return (
    <>
      {/* Hero: balance + this-month KPIs */}
      <div className="mb-8 grid lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-fg mb-2 flex items-center gap-2">
            <Wallet className="size-3.5" /> Cash on hand
          </div>
          <Amount
            paise={balance}
            className="text-5xl lg:text-6xl font-semibold tracking-tight block"
            tone={balance < 0 ? "negative" : "default"}
          />
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-fg">
            <span className="inline-flex items-center gap-1.5">
              <ArrowUpRight className="size-3.5 text-positive" />
              <Amount paise={monthIncome} tone="positive" className="text-sm" />
              <span className="text-muted-fg">in</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ArrowDownLeft className="size-3.5 text-negative" />
              <Amount paise={monthOut} tone="negative" className="text-sm" />
              <span className="text-muted-fg">spent</span>
            </span>
            {monthInvest > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <PiggyBank className="size-3.5 text-invest" />
                <Amount paise={monthInvest} className="text-sm" />
                <span className="text-muted-fg">invested</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5">
              <TrendingUp className="size-3 text-muted-fg" />
              <span className="text-xs">net</span>
              <Amount paise={monthNet} tone={monthNet >= 0 ? "positive" : "negative"} className="text-xs" />
            </span>
          </div>
        </div>
      </div>

      {/* Quick stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={ArrowDownToLine} accent="text-positive" label="Income (mo)"   value={monthIncome}    href="/income" />
        <StatCard icon={Receipt}         accent="text-negative" label="Expenses (mo)" value={monthExpense}   href="/expenses" />
        <StatCard icon={CreditCard}      accent="text-warning"  label="Bills paid"    value={monthBillsPaid} href="/bills" />
        <StatCard icon={PiggyBank}       accent="text-invest"   label="Invested"      value={investedTotal}  href="/investments" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-3 mb-3">
        <Card className="min-w-0">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
              <TrendingUp className="size-3.5" /> 6-month trend
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-fg">
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-positive" /> income</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-negative" /> spend</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-invest" /> invested</span>
            </div>
          </div>
          <CardContent className="pt-1 min-w-0">
            <SpendTrendChart data={trend} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
              <Receipt className="size-3.5 text-negative" /> This month
            </div>
            <Link href="/expenses" className="text-xs text-muted-fg hover:text-foreground">View all →</Link>
          </div>
          <CardContent className="pt-2">
            <CategoryDonut data={categoryData} />
          </CardContent>
        </Card>
      </div>

      {/* Activity + side panels */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-3">
        <Card>
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
              <ActivityIcon className="size-3.5" /> Recent activity
            </div>
          </div>
          <ActivityFeed items={activity} />
        </Card>

        <div className="space-y-3">
          {/* Upcoming bills */}
          <Card>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-warning" /> Upcoming bills
              </div>
              <Link href="/bills" className="text-xs text-muted-fg hover:text-foreground">View all →</Link>
            </div>
            {upcomingBills.length === 0 ? (
              <Empty icon={CreditCard} title="No bills due" hint="You're caught up this cycle." />
            ) : (
              <ul className="divide-y divide-border">
                {upcomingBills.map((b) => {
                  const days = daysFromNow(b.due_on);
                  return (
                    <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{b.name}</div>
                        <div className={cn("text-[11px] mt-0.5", days <= 3 ? "text-warning" : "text-muted-fg")}>
                          {days <= 0 ? "Due today" : `In ${days}d · ${fmtDate(b.due_on, "d MMM")}`}
                        </div>
                      </div>
                      <Amount paise={b.amount} tone="muted" className="text-sm" />
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Lending net */}
          <Card>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
                <HandCoins className="size-3.5 text-lending" /> Lending
              </div>
              <Link href="/lending" className="text-xs text-muted-fg hover:text-foreground">View all →</Link>
            </div>
            <CardContent className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-fg">Owed to you</div>
                <Amount paise={totalOwedToMe} tone="positive" className="text-lg block mt-1" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-fg">You owe</div>
                <Amount paise={totalIOwe} tone="negative" className="text-lg block mt-1" />
              </div>
              <div className="col-span-2 pt-2 border-t border-border flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wider text-muted-fg">Net</div>
                <Amount paise={netLending} tone={netLending >= 0 ? "positive" : "negative"} className="text-base" />
              </div>
            </CardContent>
          </Card>

          {/* Active ventures */}
          <Card>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
                <Briefcase className="size-3.5 text-venture" /> Active ventures
              </div>
              <Link href="/ventures" className="text-xs text-muted-fg hover:text-foreground">View all →</Link>
            </div>
            {activeVentures.length === 0 ? (
              <Empty icon={Briefcase} title="No active ventures" />
            ) : (
              <ul className="divide-y divide-border">
                {activeVentures.map((v) => (
                  <li key={v.id}>
                    <Link href={`/ventures/${v.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/30 transition">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{v.name}</div>
                        <div className="text-[11px] text-muted-fg mt-0.5">Your {v.my_percentage}% · {fmtDate(v.started_on, "d MMM")}</div>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-fg" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Subscriptions due this week */}
          <Card>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
                <Repeat className="size-3.5" /> Subs · this week
              </div>
              <div className="text-[10px] text-muted-fg">
                <Amount paise={monthlySubBurn} className="text-[10px]" />/mo
              </div>
            </div>
            {subsThisWeek.length === 0 ? (
              <Empty icon={Repeat} title="None this week" />
            ) : (
              <ul className="divide-y divide-border">
                {subsThisWeek.map((s) => {
                  const days = daysFromNow(s.due_on);
                  return (
                    <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        <div className="text-[11px] text-muted-fg mt-0.5">
                          {days === 0 ? "Today" : `In ${days}d · ${fmtDate(s.due_on, "d MMM")}`}
                        </div>
                      </div>
                      <Amount paise={s.amount_inr} tone="muted" className="text-sm" />
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function StatCard({
  icon: Icon, label, value, href, accent,
}: { icon: typeof Wallet; label: string; value: number; href: string; accent: string }) {
  return (
    <Link href={href} className="group">
      <Card className="hover:bg-surface-2/30 transition group-hover:border-foreground/20">
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-muted-fg">{label}</div>
            <div className={cn("size-7 rounded-lg bg-surface-2 border border-border grid place-items-center", accent)}>
              <Icon className="size-3.5" />
            </div>
          </div>
          <Amount paise={value} className="text-2xl block mt-3" />
        </CardContent>
      </Card>
    </Link>
  );
}
