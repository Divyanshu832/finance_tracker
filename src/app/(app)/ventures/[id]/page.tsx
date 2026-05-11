import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, Plus, ArrowLeft, Users, Banknote, HandCoins, AlertCircle, Lock, Unlock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Amount } from "@/components/money/amount";
import { DeleteButton } from "@/components/delete-button";
import { EditVentureDialog } from "@/components/edit-venture-dialog";
import { EditParticipantDialog } from "@/components/edit-participant-dialog";
import { EditContributionDialog } from "@/components/edit-contribution-dialog";
import { AddContributionForm } from "@/components/venture/add-contribution";
import {
  addParticipant, removeParticipant, deleteContribution,
  closeVenture, reopenVenture, deleteVenture,
} from "@/actions/ventures";
import { getVenture, getSettlements, outstanding } from "@/lib/queries";
import { computeShares, percentageRemaining } from "@/lib/ventures";
import { fmtDate, todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

export default async function VentureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ venture, participants, contributions, lendings }, settlements] = await Promise.all([
    getVenture(id),
    getSettlements(),
  ]);
  if (!venture) notFound();

  const shares = computeShares(venture.my_percentage, participants, contributions);
  const partMap = new Map(participants.map((p) => [p.id, p]));
  const pctRemaining = percentageRemaining(venture.my_percentage, participants);

  return (
    <>
      <Link href="/ventures" className="inline-flex items-center gap-2 text-sm text-muted-fg hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> All ventures
      </Link>

      <PageHeader
        title={venture.name}
        subtitle={venture.description || `Started ${fmtDate(venture.started_on)} · Your ${venture.my_percentage}% share`}
        icon={Briefcase}
        iconClassName="text-venture"
        action={
          <div className="flex gap-2">
            <EditVentureDialog venture={{ id: venture.id, name: venture.name, description: venture.description, my_percentage: venture.my_percentage, started_on: venture.started_on, notes: venture.notes }} />
            {venture.status === "active" ? (
              <form action={async () => { "use server"; await closeVenture(id, todayISO()); }}>
                <Button type="submit" variant="secondary" size="sm"><Lock className="size-3.5" /> Close venture</Button>
              </form>
            ) : (
              <form action={async () => { "use server"; await reopenVenture(id); }}>
                <Button type="submit" variant="secondary" size="sm"><Unlock className="size-3.5" /> Reopen</Button>
              </form>
            )}
            <form action={async () => { "use server"; await deleteVenture(id); }}>
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
              <Amount paise={shares.total_invested} className="text-2xl mt-1 block" />
            </CardContent></Card>
            <Card><CardContent>
              <div className="text-xs uppercase tracking-wider text-muted-fg">Your share target</div>
              <Amount paise={shares.my_target} className="text-2xl mt-1 block" />
              <div className="text-[10px] text-muted-fg mt-1">{venture.my_percentage}% of total</div>
            </CardContent></Card>
            <Card><CardContent>
              <div className="text-xs uppercase tracking-wider text-muted-fg">You actually paid</div>
              <Amount paise={shares.my_actual} className="text-2xl mt-1 block" />
              {shares.my_delta !== 0 && (
                <div className={cn("text-[10px] mt-1", shares.my_delta > 0 ? "text-positive" : "text-negative")}>
                  {shares.my_delta > 0 ? "Overpaid by " : "Underpaid by "}
                  <Amount paise={Math.abs(shares.my_delta)} className="text-[10px]" />
                </div>
              )}
            </CardContent></Card>
          </div>

          {/* Participants */}
          <Card>
            <div className="px-5 pt-4 pb-2 text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
              <Users className="size-3.5" /> Participants
              {pctRemaining > 0 && participants.length > 0 && (
                <span className="ml-auto normal-case text-warning flex items-center gap-1">
                  <AlertCircle className="size-3" /> {pctRemaining}% unassigned
                </span>
              )}
            </div>
            {participants.length === 0 && venture.my_percentage === 100 ? (
              <Empty icon={Users} title="Solo venture" hint="You hold 100% — no partners needed." />
            ) : (
              <ul className="divide-y divide-border">
                <li className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1">
                    <div className="font-medium">You</div>
                    <div className="text-xs text-muted-fg">{venture.my_percentage}% share</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-fg">target</div>
                    <Amount paise={shares.my_target} className="text-sm" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-fg">paid</div>
                    <Amount paise={shares.my_actual} className="text-sm" tone={shares.my_delta >= 0 ? "default" : "negative"} />
                  </div>
                </li>
                {shares.participants.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-fg">{p.percentage}% share</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-fg">target</div>
                      <Amount paise={p.target} className="text-sm" />
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-fg">paid</div>
                      <Amount paise={p.actual} className="text-sm" tone={p.delta > 0 ? "positive" : p.delta < 0 ? "negative" : "default"} />
                    </div>
                    <EditParticipantDialog participant={{ id: p.id, name: p.name, percentage: p.percentage }} ventureId={id} />
                    <DeleteButton action={async () => { "use server"; await removeParticipant(p.id, id); }} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Contributions ledger */}
          <Card>
            <div className="px-5 pt-4 pb-2 text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
              <Banknote className="size-3.5" /> Contributions ({contributions.length})
            </div>
            {contributions.length === 0 ? (
              <Empty icon={Banknote} title="No contributions yet" hint="Record your first capital injection on the right." />
            ) : (
              <ul className="divide-y divide-border">
                {contributions.map((c) => {
                  const who = c.contributor_kind === "me" ? "You" : partMap.get(c.participant_id ?? "")?.name ?? "Unknown";
                  return (
                    <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{who}</div>
                        <div className="text-xs text-muted-fg flex gap-2 mt-0.5">
                          <span>{fmtDate(c.contributed_on)}</span>
                          {c.linked_lending_id && (
                            <span className="rounded-md bg-warning/15 text-warning px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                              Auto-lending
                            </span>
                          )}
                        </div>
                      </div>
                      <Amount paise={c.amount} />
                      <EditContributionDialog
                        contribution={{ id: c.id, contributor_kind: c.contributor_kind, participant_id: c.participant_id, amount: c.amount, contributed_on: c.contributed_on }}
                        ventureId={id}
                        participants={participants.map((p) => ({ id: p.id, name: p.name }))}
                      />
                      <DeleteButton action={async () => { "use server"; await deleteContribution(c.id, id); }} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Linked lendings */}
          {lendings.length > 0 && (
            <Card>
              <div className="px-5 pt-4 pb-2 text-xs uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
                <HandCoins className="size-3.5" /> Linked lendings
              </div>
              <ul className="divide-y divide-border">
                {lendings.map((l) => {
                  const out = outstanding(l, settlements);
                  return (
                    <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{l.counterparty}</div>
                        <div className="text-xs text-muted-fg mt-0.5 flex gap-2">
                          <span>{l.direction === "lent" ? "Owes you" : "You owe"}</span>
                          {l.source === "venture_auto" && (
                            <span className="rounded-md bg-foreground/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">Auto</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Amount paise={out} tone={l.direction === "lent" ? "positive" : "negative"} />
                        <div className="text-[10px] text-muted-fg">of <Amount paise={l.amount} className="text-[10px]" /></div>
                      </div>
                      <Link
                        href="/lending"
                        className="text-xs text-muted-fg hover:text-foreground underline-offset-4 hover:underline"
                      >
                        Settle →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <Card>
            <CardContent>
              <div className="text-sm font-medium mb-3">Add contribution</div>
              <AddContributionForm
                ventureId={id}
                participants={participants.map((p) => ({ id: p.id, name: p.name }))}
              />
            </CardContent>
          </Card>

          <form action={addParticipant}>
            <input type="hidden" name="venture_id" value={id} />
            <Card>
              <CardContent className="space-y-3">
                <div className="text-sm font-medium mb-1">Add participant</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="p_name">Name</Label>
                    <Input id="p_name" name="name" placeholder="Rohan" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p_pct">Share %</Label>
                    <Input
                      id="p_pct"
                      name="percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max={pctRemaining || 100}
                      defaultValue={pctRemaining || 0}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" variant="secondary" className="w-full">
                  <Plus className="size-4" /> Add
                </Button>
                {pctRemaining === 0 && participants.length > 0 && (
                  <p className="text-[10px] text-muted-fg">
                    All shares allocated. Remove someone or adjust your % to add more.
                  </p>
                )}
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </>
  );
}
