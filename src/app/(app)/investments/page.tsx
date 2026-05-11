import { PiggyBank, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { Empty } from "@/components/ui/empty";
import { Amount } from "@/components/money/amount";
import { DeleteButton } from "@/components/delete-button";
import { EditInvestmentDialog } from "@/components/edit-investment-dialog";
import { EmergencyFundCard } from "@/components/emergency-fund-card";
import { addInvestment, deleteInvestment } from "@/actions/investments";
import { getInvestments, getEmergencyFund } from "@/lib/queries";
import { fmtDate, todayISO } from "@/lib/dates";

const TYPE_LABELS: Record<string, string> = {
  mf: "Mutual Fund", stock: "Stock", fd: "FD", rd: "RD",
  gold: "Gold", crypto: "Crypto", other: "Other",
};

export default async function InvestmentsPage() {
  const [items, emergency] = await Promise.all([
    getInvestments(),
    getEmergencyFund(),
  ]);
  const total = items.reduce((s, i) => s + i.amount, 0);

  // Group by type for the breakdown
  const byType = items.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + i.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <PageHeader
        title="Investments"
        subtitle="What you've deployed from your salary. Log-only — no live prices."
        icon={PiggyBank}
        iconClassName="text-invest"
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-3">
          <EmergencyFundCard target={emergency.target} saved={emergency.saved} />

          <Card>
            <CardContent>
              <div className="text-xs uppercase tracking-wider text-muted-fg">Total invested</div>
              <Amount paise={total} className="text-3xl mt-1 block" tone="default" />
              {Object.keys(byType).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(byType).map(([t, amt]) => (
                    <span key={t} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1 text-xs">
                      <span className="text-muted-fg">{TYPE_LABELS[t] || t}</span>
                      <Amount paise={amt} className="text-xs" />
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {items.length === 0 ? (
            <Card><Empty icon={PiggyBank} title="No investments logged" hint="Log every SIP, FD, or buy on the right." /></Card>
          ) : (
            <Card>
              <ul className="divide-y divide-border">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{i.name}</div>
                      <div className="text-xs text-muted-fg mt-0.5 flex gap-2">
                        <span>{TYPE_LABELS[i.type] || i.type}</span>
                        {i.platform && <span>· {i.platform}</span>}
                        <span>· {fmtDate(i.invested_on)}</span>
                      </div>
                    </div>
                    <Amount paise={i.amount} />
                    <EditInvestmentDialog investment={{ id: i.id, name: i.name, type: i.type, platform: i.platform, amount: i.amount, invested_on: i.invested_on }} />
                    <DeleteButton action={async () => { "use server"; await deleteInvestment(i.id); }} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <form action={addInvestment} className="space-y-3">
          <Card>
            <CardContent className="space-y-3">
              <div className="text-sm font-medium mb-1">New investment</div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Parag Parikh Flexi Cap" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="type">Type</Label>
                  <Select id="type" name="type" defaultValue="mf">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="platform">Platform</Label>
                  <Input id="platform" name="platform" placeholder="Zerodha" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invested_on">Date</Label>
                  <Input id="invested_on" name="invested_on" type="date" defaultValue={todayISO()} required />
                </div>
              </div>
              <SubmitButton className="w-full" pendingText="Adding…"><Plus className="size-4" /> Add investment</SubmitButton>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
