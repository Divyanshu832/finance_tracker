import { Receipt, Plus, Tag } from "lucide-react";
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
import { EditExpenseDialog } from "@/components/edit-expense-dialog";
import { addExpense, deleteExpense } from "@/actions/expenses";
import { getCategories, getExpenses } from "@/lib/queries";
import { fmtDate, todayISO, monthCycle } from "@/lib/dates";

export default async function ExpensesPage() {
  const [categories, expenses] = await Promise.all([getCategories(), getExpenses()]);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const { start, end } = monthCycle();
  const thisMonth = expenses.filter((e) => e.occurred_on >= start && e.occurred_on <= end);
  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Personal spending across categories."
        icon={Receipt}
        iconClassName="text-negative"
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-3">
          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-fg">This month</div>
                <Amount paise={monthTotal} className="text-3xl mt-1 block" tone="negative" />
              </div>
              <div className="text-xs text-muted-fg">{thisMonth.length} txns</div>
            </CardContent>
          </Card>

          {expenses.length === 0 ? (
            <Card><Empty icon={Receipt} title="No expenses yet" hint="Log your first spend on the right." /></Card>
          ) : (
            <Card>
              <ul className="divide-y divide-border">
                {expenses.slice(0, 200).map((e) => {
                  const cat = e.category_id ? catMap.get(e.category_id) : null;
                  return (
                    <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{e.description || cat?.name || "Expense"}</div>
                        <div className="text-xs text-muted-fg flex gap-2 mt-0.5 items-center">
                          {cat && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5">
                              <Tag className="size-3" /> {cat.name}
                            </span>
                          )}
                          <span>{fmtDate(e.occurred_on)}</span>
                          {e.subscription_id && (
                            <span className="rounded-md bg-foreground/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">Sub</span>
                          )}
                        </div>
                      </div>
                      <Amount paise={e.amount} tone="negative" />
                      <EditExpenseDialog
                        expense={{
                          id: e.id,
                          amount: e.amount,
                          category_id: e.category_id,
                          description: e.description,
                          occurred_on: e.occurred_on,
                        }}
                        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                      />
                      <DeleteButton action={async () => { "use server"; await deleteExpense(e.id); }} />
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>

        <form action={addExpense} className="space-y-3">
          <Card>
            <CardContent className="space-y-3">
              <div className="text-sm font-medium mb-1">New expense</div>

              <div className="space-y-1.5">
                <Label htmlFor="description">What for?</Label>
                <Input id="description" name="description" placeholder="Lunch at Burma Burma" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="occurred_on">Date</Label>
                  <Input id="occurred_on" name="occurred_on" type="date" defaultValue={todayISO()} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category_id">Category</Label>
                <Select id="category_id" name="category_id" defaultValue="">
                  <option value="">Uncategorised</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <SubmitButton className="w-full" pendingText="Adding…"><Plus className="size-4" /> Add expense</SubmitButton>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
