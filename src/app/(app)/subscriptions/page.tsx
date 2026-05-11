import { Repeat, Plus, ToggleLeft, ToggleRight } from "lucide-react";
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
import { EditSubscriptionDialog } from "@/components/edit-subscription-dialog";
import {
  addSubscription, deleteSubscription, toggleSubscription, processDueSubscriptions,
} from "@/actions/subscriptions";
import { getCategories, getSubscriptions } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default async function SubscriptionsPage() {
  const [subs, categories] = await Promise.all([getSubscriptions(), getCategories()]);
  const active = subs.filter((s) => s.active);
  const monthly = active.reduce((s, x) => s + x.amount_inr, 0);

  return (
    <>
      <PageHeader
        title="Subscriptions"
        subtitle="Recurring services. We auto-create an expense every billing day."
        icon={Repeat}
        action={
          <form action={async () => { "use server"; await processDueSubscriptions(); }}>
            <SubmitButton variant="secondary" pendingText="Syncing…" size="sm">Sync due this month</SubmitButton>
          </form>
        }
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-3">
          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-fg">Monthly burn</div>
                <Amount paise={monthly} className="text-3xl mt-1 block" />
              </div>
              <div className="text-xs text-muted-fg">{active.length} active · {subs.length - active.length} paused</div>
            </CardContent>
          </Card>

          {subs.length === 0 ? (
            <Card><Empty icon={Repeat} title="No subscriptions" hint="Add Netflix, Spotify, ChatGPT, anything recurring." /></Card>
          ) : (
            <Card>
              <ul className="divide-y divide-border">
                {subs.map((s) => (
                  <li key={s.id} className={cn("flex items-center gap-3 px-5 py-3", !s.active && "opacity-50")}>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{s.name}</div>
                      <div className="text-xs text-muted-fg mt-0.5">
                        Billed on {s.billing_day} · {s.native_currency}
                      </div>
                    </div>
                    <Amount paise={s.amount_inr} className="text-sm" />
                    <form action={async () => { "use server"; await toggleSubscription(s.id, !s.active); }}>
                      <button
                        type="submit"
                        className="size-8 grid place-items-center rounded-md text-muted-fg hover:text-foreground hover:bg-surface-2 transition"
                        title={s.active ? "Pause" : "Resume"}
                      >
                        {s.active ? <ToggleRight className="size-4 text-positive" /> : <ToggleLeft className="size-4" />}
                      </button>
                    </form>
                    <EditSubscriptionDialog
                      sub={{ id: s.id, name: s.name, amount_inr: s.amount_inr, native_currency: s.native_currency, billing_day: s.billing_day, category_id: s.category_id }}
                      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                    />
                    <DeleteButton action={async () => { "use server"; await deleteSubscription(s.id); }} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <form action={addSubscription} className="space-y-3">
          <Card>
            <CardContent className="space-y-3">
              <div className="text-sm font-medium mb-1">New subscription</div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="ChatGPT Plus" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount_inr">Amount (₹)</Label>
                  <Input id="amount_inr" name="amount_inr" type="number" step="0.01" min="0" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="billing_day">Billing day</Label>
                  <Input id="billing_day" name="billing_day" type="number" min="1" max="31" defaultValue={1} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="native_currency">Currency</Label>
                  <Input id="native_currency" name="native_currency" defaultValue="INR" maxLength={8} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category_id">Category</Label>
                  <Select id="category_id" name="category_id" defaultValue="">
                    <option value="">Subscriptions</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <SubmitButton className="w-full" pendingText="Adding…"><Plus className="size-4" /> Add subscription</SubmitButton>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
