import Link from "next/link";
import { PiggyBank, Plus, Repeat, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { Empty } from "@/components/ui/empty";
import { Amount } from "@/components/money/amount";
import { EmergencyFundCard } from "@/components/emergency-fund-card";
import { addInvestment } from "@/actions/investments";
import { getInvestmentsWithStats, getEmergencyFund } from "@/lib/queries";
import { fmtDate, todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  mf: "Mutual Fund", stock: "Stock", fd: "FD", rd: "RD",
  gold: "Gold", crypto: "Crypto", other: "Other",
};

export default async function InvestmentsPage() {
  const [items, emergency] = await Promise.all([
    getInvestmentsWithStats(),
    getEmergencyFund(),
  ]);
  const total = items.reduce((s, i) => s + i.total, 0);
  const monthlySip = items.reduce((s, i) => s + i.monthlySip, 0);

  const byType = items.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + i.total;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <PageHeader
        title="Investments"
        subtitle="Holdings, lumpsums, and SIPs. Log-only — no live prices."
        icon={PiggyBank}
        iconClassName="text-invest"
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-3">
          <EmergencyFundCard target={emergency.target} saved={emergency.saved} />

          <Card>
            <CardContent>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-fg">Total invested</div>
                  <Amount paise={total} className="text-3xl mt-1 block" tone="default" />
                </div>
                {monthlySip > 0 && (
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5 justify-end">
                      <Repeat className="size-3" /> Monthly SIP
                    </div>
                    <Amount paise={monthlySip} className="text-lg mt-1 block" tone="positive" />
                  </div>
                )}
              </div>
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
            <Card><Empty icon={PiggyBank} title="No holdings yet" hint="Create one on the right, then add lumpsums or set up a SIP." /></Card>
          ) : (
            <Card>
              <ul className="divide-y divide-border">
                {items.map((i) => (
                  <li key={i.id}>
                    <Link
                      href={`/investments/${i.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/40 transition group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center gap-2">
                          <span className="truncate">{i.name}</span>
                          {i.activeSips > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-positive/15 text-positive px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                              <Repeat className="size-3" /> SIP
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-fg mt-0.5 flex gap-2 flex-wrap">
                          <span>{TYPE_LABELS[i.type] || i.type}</span>
                          {i.platform && <span>· {i.platform}</span>}
                          {i.lastActivity && <span>· last {fmtDate(i.lastActivity)}</span>}
                          <span>· {i.txCount} {i.txCount === 1 ? "txn" : "txns"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Amount paise={i.total} className="text-base" />
                        {i.monthlySip > 0 && (
                          <div className="text-[10px] text-muted-fg mt-0.5">
                            <Amount paise={i.monthlySip} className="text-[10px]" />/mo
                          </div>
                        )}
                      </div>
                      <ArrowRight className={cn("size-4 text-muted-fg group-hover:text-foreground group-hover:translate-x-0.5 transition-all")} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <form action={addInvestment} className="space-y-3">
          <Card>
            <CardContent className="space-y-3">
              <div className="text-sm font-medium mb-1">New holding</div>

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

              <div className="rounded-md border border-dashed border-border p-3 space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-fg">Optional initial lumpsum</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="initial_amount">Amount (₹)</Label>
                    <Input id="initial_amount" name="initial_amount" type="number" step="0.01" min="0" placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="initial_date">Date</Label>
                    <Input id="initial_date" name="initial_date" type="date" defaultValue={todayISO()} />
                  </div>
                </div>
                <p className="text-[10px] text-muted-fg">Add more lumpsums or set up a SIP on the holding page.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Optional" />
              </div>

              <SubmitButton className="w-full" pendingText="Creating…">
                <Plus className="size-4" /> Create holding
              </SubmitButton>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
