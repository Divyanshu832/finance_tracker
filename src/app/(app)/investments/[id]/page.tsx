import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PiggyBank, Plus, ArrowLeft, Banknote, Repeat,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { Empty } from "@/components/ui/empty";
import { Amount } from "@/components/money/amount";
import { DeleteButton } from "@/components/delete-button";
import { EditInvestmentDialog } from "@/components/edit-investment-dialog";
import { Button } from "@/components/ui/button";
import { addLumpsum, deleteTransaction, toggleTransactionExcluded } from "@/actions/investment-transactions";
import { Archive, ArchiveRestore } from "lucide-react";
import { createSip, deleteSip, toggleSip } from "@/actions/investment-sips";
import { deleteInvestment } from "@/actions/investments";
import { getInvestment } from "@/lib/queries";
import { fmtDate, todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  mf: "Mutual Fund", stock: "Stock", fd: "FD", rd: "RD",
  gold: "Gold", crypto: "Crypto", other: "Other",
};

export default async function InvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { investment, transactions, sips } = await getInvestment(id);
  if (!investment) notFound();

  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const activeSips = sips.filter((s) => s.active);
  const monthlySip = activeSips.reduce((s, x) => s + x.monthly_amount, 0);
  const lumpsumCount = transactions.filter((t) => !t.sip_id).length;
  const sipCount = transactions.length - lumpsumCount;

  return (
    <>
      <Link href="/investments" className="inline-flex items-center gap-2 text-sm text-muted-fg hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> All investments
      </Link>

      <PageHeader
        title={investment.name}
        subtitle={`${TYPE_LABELS[investment.type] || investment.type}${investment.platform ? ` · ${investment.platform}` : ""}`}
        icon={PiggyBank}
        iconClassName="text-invest"
        action={
          <div className="flex gap-2">
            <EditInvestmentDialog investment={{ id: investment.id, name: investment.name, type: investment.type, platform: investment.platform }} triggerLabel="Edit" />
            <form action={async () => { "use server"; await deleteInvestment(id); }}>
              <Button type="submit" variant="danger" size="sm">Delete</Button>
            </form>
          </div>
        }
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent>
              <div className="text-xs uppercase tracking-wider text-muted-fg">Total invested</div>
              <Amount paise={total} className="text-2xl mt-1 block" />
              <div className="text-[10px] text-muted-fg mt-1">{transactions.length} {transactions.length === 1 ? "transaction" : "transactions"}</div>
            </CardContent></Card>
            <Card><CardContent>
              <div className="text-xs uppercase tracking-wider text-muted-fg">Lumpsums</div>
              <div className="text-2xl mt-1 font-medium">{lumpsumCount}</div>
              <div className="text-[10px] text-muted-fg mt-1">one-time buys</div>
            </CardContent></Card>
            <Card><CardContent>
              <div className="text-xs uppercase tracking-wider text-muted-fg">SIP / month</div>
              <Amount paise={monthlySip} className="text-2xl mt-1 block" tone={monthlySip > 0 ? "positive" : "default"} />
              <div className="text-[10px] text-muted-fg mt-1">{activeSips.length} active · {sipCount} installments</div>
            </CardContent></Card>
          </div>

          {/* SIPs */}
          <Card>
            <div className="px-5 pt-4 pb-2 text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
              <Repeat className="size-3.5" /> SIPs
            </div>
            {sips.length === 0 ? (
              <Empty icon={Repeat} title="No SIPs configured" hint="Set up a monthly recurring buy on the right." />
            ) : (
              <ul className="divide-y divide-border">
                {sips.map((s) => (
                  <li key={s.id} className={cn("flex items-center gap-3 px-5 py-3", !s.active && "opacity-50")}>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-2">
                        <Amount paise={s.monthly_amount} className="text-sm" /> / month
                      </div>
                      <div className="text-xs text-muted-fg mt-0.5">
                        on the {ordinal(s.sip_day)} · from {fmtDate(s.start_on)}
                        {s.end_on && <> · until {fmtDate(s.end_on)}</>}
                      </div>
                    </div>
                    <form action={async () => { "use server"; await toggleSip(s.id, !s.active, id); }}>
                      <button
                        type="submit"
                        className="size-8 grid place-items-center rounded-md text-muted-fg hover:text-foreground hover:bg-surface-2 transition"
                        title={s.active ? "Pause" : "Resume"}
                      >
                        {s.active ? <ToggleRight className="size-4 text-positive" /> : <ToggleLeft className="size-4" />}
                      </button>
                    </form>
                    <DeleteButton action={async () => { "use server"; await deleteSip(s.id, id); }} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Transactions ledger */}
          <Card>
            <div className="px-5 pt-4 pb-2 text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
              <Banknote className="size-3.5" /> Transactions ({transactions.length})
            </div>
            {transactions.length === 0 ? (
              <Empty icon={Banknote} title="No transactions yet" hint="Record your first lumpsum on the right." />
            ) : (
              <ul className="divide-y divide-border">
                {transactions.map((t) => (
                  <li key={t.id} className={cn("flex items-center gap-3 px-5 py-3", t.excluded_from_balance && "opacity-60")}>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                        {t.sip_id ? "SIP installment" : "Lumpsum"}
                        {t.sip_id && (
                          <span className="rounded-md bg-positive/15 text-positive px-1.5 py-0.5 text-[10px] uppercase tracking-wider flex items-center gap-1">
                            <Repeat className="size-3" /> Auto
                          </span>
                        )}
                        {t.excluded_from_balance && (
                          <span className="rounded-md bg-foreground/10 text-muted-fg px-1.5 py-0.5 text-[10px] uppercase tracking-wider flex items-center gap-1">
                            <Archive className="size-3" /> Historical
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-fg mt-0.5">{fmtDate(t.occurred_on)}</div>
                    </div>
                    <Amount paise={t.amount} />
                    <form action={async () => { "use server"; await toggleTransactionExcluded(t.id, !t.excluded_from_balance, id); }}>
                      <button
                        type="submit"
                        className="size-8 grid place-items-center rounded-md text-muted-fg hover:text-foreground hover:bg-surface-2 transition"
                        title={t.excluded_from_balance ? "Include in cash balance" : "Mark as pre-app history (won't affect balance)"}
                      >
                        {t.excluded_from_balance
                          ? <ArchiveRestore className="size-4" />
                          : <Archive className="size-4" />}
                      </button>
                    </form>
                    <DeleteButton action={async () => { "use server"; await deleteTransaction(t.id, id); }} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-3">
          <form action={addLumpsum}>
            <input type="hidden" name="investment_id" value={id} />
            <Card>
              <CardContent className="space-y-3">
                <div className="text-sm font-medium mb-1">Add lumpsum</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ls_amount">Amount (₹)</Label>
                    <Input id="ls_amount" name="amount" type="number" step="0.01" min="0" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ls_date">Date</Label>
                    <Input id="ls_date" name="occurred_on" type="date" defaultValue={todayISO()} required />
                  </div>
                </div>
                <label className="flex items-center gap-2.5 rounded-md border border-border bg-background/40 px-3 py-2.5 cursor-pointer hover:bg-surface-2/40 transition">
                  <input
                    type="checkbox"
                    name="excluded_from_balance"
                    className="size-4 rounded border-border accent-positive"
                  />
                  <span className="text-sm">Historical (don&apos;t affect cash balance)</span>
                </label>
                <SubmitButton variant="secondary" className="w-full" pendingText="Adding…">
                  <Plus className="size-4" /> Add lumpsum
                </SubmitButton>
              </CardContent>
            </Card>
          </form>

          <form action={createSip}>
            <input type="hidden" name="investment_id" value={id} />
            <Card>
              <CardContent className="space-y-3">
                <div className="text-sm font-medium mb-1">Configure SIP</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sip_amount">Monthly (₹)</Label>
                    <Input id="sip_amount" name="monthly_amount" type="number" step="0.01" min="0" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sip_day">Day of month</Label>
                    <Input id="sip_day" name="sip_day" type="number" min="1" max="31" defaultValue={1} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sip_start">Start</Label>
                    <Input id="sip_start" name="start_on" type="date" defaultValue={todayISO()} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sip_end">End (optional)</Label>
                    <Input id="sip_end" name="end_on" type="date" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sip_notes">Notes</Label>
                  <Textarea id="sip_notes" name="notes" placeholder="Optional" />
                </div>
                <SubmitButton className="w-full" pendingText="Saving…">
                  <Repeat className="size-4" /> Start SIP
                </SubmitButton>
                <p className="text-[10px] text-muted-fg">
                  Cron runs daily — installments are created on the SIP day. Today&apos;s due installment is filled in immediately if it&apos;s already past the day.
                </p>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
