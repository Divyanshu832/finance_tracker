import Link from "next/link";
import { HandCoins, Plus, Briefcase, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Amount } from "@/components/money/amount";
import { DeleteButton } from "@/components/delete-button";
import { EditLendingDialog } from "@/components/edit-lending-dialog";
import { SettleDialog } from "@/components/settle-dialog";
import { addLending, deleteLending, settleLending } from "@/actions/lendings";
import { getLendings, getSettlements, getVentures, outstanding } from "@/lib/queries";
import { fmtDate, todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

async function settleAction(id: string, rupees: number, settledOn: string) {
  "use server";
  await settleLending(id, rupees, settledOn);
}

export default async function LendingPage() {
  const [lendings, settlements, ventures] = await Promise.all([getLendings(), getSettlements(), getVentures()]);
  const ventureMap = new Map(ventures.map((v) => [v.id, v]));

  const enriched = lendings.map((l) => ({
    ...l,
    outstanding: outstanding(l, settlements),
    venture: l.venture_id ? ventureMap.get(l.venture_id) : null,
  }));

  const owedToMe = enriched.filter((l) => l.direction === "lent");
  const iOwe = enriched.filter((l) => l.direction === "borrowed");
  const totalOwed = owedToMe.reduce((s, l) => s + l.outstanding, 0);
  const totalIOwe = iOwe.reduce((s, l) => s + l.outstanding, 0);
  const net = totalOwed - totalIOwe;

  return (
    <>
      <PageHeader
        title="Lending"
        subtitle="Money out, money owed. Venture-linked entries auto-update."
        icon={HandCoins}
        iconClassName="text-lending"
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent>
              <div className="text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
                <ArrowUpRight className="size-3 text-positive" /> Owed to you
              </div>
              <Amount paise={totalOwed} className="text-2xl mt-1 block" tone="positive" />
            </CardContent></Card>
            <Card><CardContent>
              <div className="text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
                <ArrowDownLeft className="size-3 text-negative" /> You owe
              </div>
              <Amount paise={totalIOwe} className="text-2xl mt-1 block" tone="negative" />
            </CardContent></Card>
            <Card><CardContent>
              <div className="text-xs uppercase tracking-wider text-muted-fg">Net</div>
              <Amount paise={net} className="text-2xl mt-1 block" tone={net >= 0 ? "positive" : "negative"} />
            </CardContent></Card>
          </div>

          <Section
            title="Owed to you"
            tone="positive"
            items={owedToMe}
            settle={settleAction}
            empty="Nothing lent out at the moment."
          />
          <Section
            title="You owe"
            tone="negative"
            items={iOwe}
            settle={settleAction}
            empty="You're square with everyone — nice."
          />
        </div>

        <form action={addLending} className="space-y-3">
          <Card>
            <CardContent className="space-y-3">
              <div className="text-sm font-medium mb-1">New lending</div>

              <div className="space-y-1.5">
                <Label htmlFor="counterparty">Person</Label>
                <Input id="counterparty" name="counterparty" placeholder="Rohan" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="direction">Direction</Label>
                  <Select id="direction" name="direction" defaultValue="lent">
                    <option value="lent">You lent</option>
                    <option value="borrowed">You borrowed</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="occurred_on">Date</Label>
                <Input id="occurred_on" name="occurred_on" type="date" defaultValue={todayISO()} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Optional" />
              </div>
              <Button type="submit" className="w-full"><Plus className="size-4" /> Add lending</Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}

type EnrichedLending = Awaited<ReturnType<typeof getLendings>>[number] & {
  outstanding: number;
  venture: { id: string; name: string } | null | undefined;
};

function Section({
  title, tone, items, settle, empty,
}: {
  title: string;
  tone: "positive" | "negative";
  items: EnrichedLending[];
  settle: (id: string, rupees: number, settledOn: string) => Promise<void>;
  empty: string;
}) {
  return (
    <Card>
      <div className="px-5 pt-4 pb-2 text-xs uppercase tracking-wider text-muted-fg flex items-center justify-between">
        <span>{title}</span>
        <span className={cn("normal-case", tone === "positive" ? "text-positive" : "text-negative")}>
          {items.length} open
        </span>
      </div>
      {items.length === 0 ? (
        <Empty icon={HandCoins} title={empty} />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{l.counterparty}</div>
                <div className="text-xs text-muted-fg mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{fmtDate(l.occurred_on)}</span>
                  {l.venture && (
                    <Link
                      href={`/ventures/${l.venture.id}`}
                      className="inline-flex items-center gap-1 rounded-md bg-venture/15 text-venture px-1.5 py-0.5 hover:bg-venture/25 transition"
                    >
                      <Briefcase className="size-3" /> {l.venture.name}
                    </Link>
                  )}
                  {l.source === "venture_auto" && (
                    <span className="rounded-md bg-foreground/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">Auto</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Amount paise={l.outstanding} tone={tone} />
                {l.outstanding !== l.amount && (
                  <div className="text-[10px] text-muted-fg">of <Amount paise={l.amount} className="text-[10px]" /></div>
                )}
              </div>
              {l.outstanding > 0 && (
                <SettleDialog
                  lendingId={l.id}
                  outstanding={l.outstanding}
                  direction={l.direction}
                  settle={settle}
                />
              )}
              <EditLendingDialog lending={{ id: l.id, counterparty: l.counterparty, direction: l.direction, amount: l.amount, occurred_on: l.occurred_on, notes: l.notes, source: l.source }} />
              <DeleteButton action={async () => { "use server"; await deleteLending(l.id); }} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
