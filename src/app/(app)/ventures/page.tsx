import Link from "next/link";
import { Briefcase, Plus, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Amount } from "@/components/money/amount";
import { createVenture } from "@/actions/ventures";
import { getSupabase } from "@/lib/supabase/server";
import { getVentures } from "@/lib/queries";
import { fmtDate, todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

async function getVentureSummaries() {
  const ventures = await getVentures();
  if (ventures.length === 0) return [];
  const sb = getSupabase();
  const { data: contribs } = await sb
    .from("venture_contributions")
    .select("venture_id, contributor_kind, amount")
    .in("venture_id", ventures.map((v) => v.id));

  return ventures.map((v) => {
    const rows = (contribs ?? []).filter((c) => c.venture_id === v.id);
    const total = rows.reduce((s, c) => s + c.amount, 0);
    const mine = rows.filter((c) => c.contributor_kind === "me").reduce((s, c) => s + c.amount, 0);
    const myTarget = Math.floor((total * v.my_percentage) / 100);
    return { ...v, total, mine, myTarget };
  });
}

export default async function VenturesPage() {
  const ventures = await getVentureSummaries();

  return (
    <>
      <PageHeader
        title="Ventures"
        subtitle="Joint plays. Track every rupee in, who paid what, and who owes whom."
        icon={Briefcase}
        iconClassName="text-venture"
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-3">
          {ventures.length === 0 ? (
            <Card><Empty icon={Briefcase} title="No ventures yet" hint="Start your first joint deal on the right." /></Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {ventures.map((v) => {
                const delta = v.mine - v.myTarget;
                const status = v.status === "active" ? "bg-positive/15 text-positive" : "bg-muted/40 text-muted-fg";
                return (
                  <Link key={v.id} href={`/ventures/${v.id}`} className="group">
                    <Card className="hover:bg-surface-2/30 transition">
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="font-medium truncate">{v.name}</div>
                          <span className={cn("text-[10px] uppercase tracking-wider rounded-md px-1.5 py-0.5", status)}>
                            {v.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-fg mt-1">Started {fmtDate(v.started_on)} · You {v.my_percentage}%</div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-fg">Total in</div>
                            <Amount paise={v.total} className="text-lg block mt-0.5" />
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-fg">Your share</div>
                            <Amount paise={v.mine} className="text-lg block mt-0.5" />
                            {delta !== 0 && v.total > 0 && (
                              <div className={cn("text-[10px] mt-0.5", delta > 0 ? "text-positive" : "text-negative")}>
                                {delta > 0 ? "+" : ""}<Amount paise={delta} className="text-[10px]" /> vs target
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-muted-fg group-hover:text-foreground transition">
                          View details <ArrowRight className="size-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <form action={createVenture} className="space-y-3">
          <Card>
            <CardContent className="space-y-3">
              <div className="text-sm font-medium mb-1">New venture</div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Cafe in Bandra" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="my_percentage">Your %</Label>
                  <Input id="my_percentage" name="my_percentage" type="number" step="0.01" min="0" max="100" defaultValue="100" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="started_on">Started</Label>
                  <Input id="started_on" name="started_on" type="date" defaultValue={todayISO()} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Optional" />
              </div>
              <Button type="submit" className="w-full"><Plus className="size-4" /> Create venture</Button>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-fg px-1">
            For solo ventures set Your % to 100. You can add partners after creation.
          </p>
        </form>
      </div>
    </>
  );
}
