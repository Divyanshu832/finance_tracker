import { CreditCard, Plus, CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Empty } from "@/components/ui/empty";
import { Amount } from "@/components/money/amount";
import { DeleteButton } from "@/components/delete-button";
import { EditBillDialog } from "@/components/edit-bill-dialog";
import { addBill, deleteBill, payBill } from "@/actions/bills";
import { getBills, getBillPayments } from "@/lib/queries";
import { todayISO, monthCycle, daysFromNow } from "@/lib/dates";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function PayButton({ billId, paidThisCycle }: { billId: string; paidThisCycle: boolean }) {
  if (paidThisCycle) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-positive">
        <CheckCircle2 className="size-3.5" /> Paid this cycle
      </span>
    );
  }
  return (
    <form action={async () => { "use server"; await payBill(billId); }}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 text-xs text-foreground rounded-md border border-border px-2.5 h-7 hover:bg-surface-2 transition"
      >
        <Circle className="size-3.5" /> Mark paid
      </button>
    </form>
  );
}

function dueIn(due_day: number) {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const d = Math.min(due_day, lastDay);
  let candidate = new Date(y, m, d);
  if (candidate < today && today.getDate() > d) {
    candidate = new Date(y, m + 1, Math.min(due_day, new Date(y, m + 2, 0).getDate()));
  }
  return daysFromNow(format(candidate, "yyyy-MM-dd"));
}

export default async function BillsPage() {
  const [bills, payments] = await Promise.all([getBills(), getBillPayments()]);
  const { cycleMonth } = monthCycle();
  const paidThisCycle = new Set(payments.filter((p) => p.cycle_month === cycleMonth).map((p) => p.bill_id));
  const monthlyTotal = bills.reduce((s, b) => s + b.amount, 0);
  const remaining = bills.filter((b) => !paidThisCycle.has(b.id)).reduce((s, b) => s + b.amount, 0);

  return (
    <>
      <PageHeader
        title="Bills & EMIs"
        subtitle="Recurring obligations — EMIs, credit cards, loans."
        icon={CreditCard}
        iconClassName="text-warning"
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent>
              <div className="text-xs uppercase tracking-wider text-muted-fg">Monthly total</div>
              <Amount paise={monthlyTotal} className="text-2xl mt-1 block" />
            </CardContent></Card>
            <Card><CardContent>
              <div className="text-xs uppercase tracking-wider text-muted-fg">Pending this cycle</div>
              <Amount paise={remaining} className="text-2xl mt-1 block" tone={remaining > 0 ? "negative" : "muted"} />
            </CardContent></Card>
          </div>

          {bills.length === 0 ? (
            <Card><Empty icon={CreditCard} title="No bills set up" hint="Add an EMI or credit card on the right." /></Card>
          ) : (
            <Card>
              <ul className="divide-y divide-border">
                {bills.map((b) => {
                  const paid = paidThisCycle.has(b.id);
                  const days = dueIn(b.due_day);
                  return (
                    <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{b.name}</div>
                        <div className="text-xs text-muted-fg mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="uppercase tracking-wider">{b.type.replace("_", " ")}</span>
                          <span>· Due {b.due_day}</span>
                          {!paid && (
                            <span className={cn(days <= 3 ? "text-warning" : "")}>
                              · {days <= 0 ? "Due today" : `in ${days}d`}
                            </span>
                          )}
                        </div>
                      </div>
                      <Amount paise={b.amount} className="text-sm" />
                      <PayButton billId={b.id} paidThisCycle={paid} />
                      <EditBillDialog bill={{ id: b.id, name: b.name, type: b.type, amount: b.amount, due_day: b.due_day, start_on: b.start_on, end_on: b.end_on, autopay: b.autopay }} />
                      <DeleteButton action={async () => { "use server"; await deleteBill(b.id); }} />
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>

        <form action={addBill} className="space-y-3">
          <Card>
            <CardContent className="space-y-3">
              <div className="text-sm font-medium mb-1">New bill / EMI</div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="HDFC Credit Card" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="type">Type</Label>
                  <Select id="type" name="type" required defaultValue="credit_card">
                    <option value="emi">EMI</option>
                    <option value="credit_card">Credit card</option>
                    <option value="loan">Loan</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="due_day">Due day</Label>
                  <Input id="due_day" name="due_day" type="number" min="1" max="31" defaultValue={5} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="start_on">Starts</Label>
                  <Input id="start_on" name="start_on" type="date" defaultValue={todayISO()} required />
                </div>
              </div>
              <SubmitButton className="w-full" pendingText="Adding…"><Plus className="size-4" /> Add bill</SubmitButton>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
