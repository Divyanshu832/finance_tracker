"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategorySlice } from "@/lib/dashboard-data";
import { Amount } from "@/components/money/amount";
import { formatINR } from "@/lib/money";

export function CategoryDonut({ data }: { data: CategorySlice[] }) {
  const total = data.reduce((s, x) => s + x.amount, 0);
  if (total === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-sm text-muted-fg">
        No spend yet this month
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[176px_1fr] gap-4 items-center min-w-0">
      <div className="relative" style={{ width: 176, height: 176 }}>
        <ResponsiveContainer width={176} height={176} minWidth={0} minHeight={0}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              innerRadius={50}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((s) => (
                <Cell key={s.id} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }}
              formatter={(v) => formatINR(Number(v))}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[10px] uppercase tracking-wider text-muted-fg">Total</div>
          <Amount paise={total} className="text-base font-semibold" />
        </div>
      </div>
      <ul className="space-y-1.5 text-xs min-w-0">
        {data.slice(0, 6).map((s) => {
          const pct = total ? Math.round((s.amount / total) * 100) : 0;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span className="size-2 rounded-sm shrink-0" style={{ background: s.color }} />
              <span className="text-muted-fg truncate flex-1">{s.name}</span>
              <span className="mono tabular-nums">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
