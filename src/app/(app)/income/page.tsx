import { ArrowDownToLine, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { Empty } from "@/components/ui/empty";
import { Amount } from "@/components/money/amount";
import { DeleteButton } from "@/components/delete-button";
import { EditIncomeDialog } from "@/components/edit-income-dialog";
import { addIncome, deleteIncome } from "@/actions/income";
import { getIncomes } from "@/lib/queries";
import { fmtDate, todayISO } from "@/lib/dates";

export default async function IncomePage() {
  const incomes = await getIncomes();
  const total = incomes.reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <PageHeader
        title="Income"
        subtitle="Money coming in — salary, freelance, gifts, anything."
        icon={ArrowDownToLine}
        iconClassName="text-positive"
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-3">
          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-fg">Lifetime received</div>
                <Amount paise={total} className="text-3xl mt-1 block" tone="positive" />
              </div>
              <div className="text-xs text-muted-fg">{incomes.length} entries</div>
            </CardContent>
          </Card>

          {incomes.length === 0 ? (
            <Card><Empty icon={ArrowDownToLine} title="No income yet" hint="Add your first inflow on the right." /></Card>
          ) : (
            <Card>
              <ul className="divide-y divide-border">
                {incomes.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{i.source}</div>
                      <div className="text-xs text-muted-fg flex gap-2 mt-0.5">
                        <span>{fmtDate(i.received_on)}</span>
                        {i.notes && <span className="truncate">· {i.notes}</span>}
                      </div>
                    </div>
                    <Amount paise={i.amount} tone="positive" />
                    <EditIncomeDialog income={{ id: i.id, source: i.source, amount: i.amount, received_on: i.received_on, notes: i.notes }} />
                    <DeleteButton action={async () => { "use server"; await deleteIncome(i.id); }} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <form action={addIncome} className="space-y-3">
          <Card>
            <CardContent className="space-y-3">
              <div className="text-sm font-medium mb-1">New income</div>

              <div className="space-y-1.5">
                <Label htmlFor="source">Source</Label>
                <Input id="source" name="source" placeholder="May salary" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="received_on">Date</Label>
                  <Input id="received_on" name="received_on" type="date" defaultValue={todayISO()} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Optional" />
              </div>
              <SubmitButton className="w-full" pendingText="Adding…"><Plus className="size-4" /> Add income</SubmitButton>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
