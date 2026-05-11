"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyPoint } from "@/lib/dashboard-data";
import { formatINRCompact, formatINR } from "@/lib/money";

const LABELS: Record<string, string> = {
  income: "Income",
  spend: "Spend",
  invest: "Invested",
};

export function SpendTrendChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div className="w-full min-w-0" style={{ height: 224 }}>
      <ResponsiveContainer width="100%" height={224} minWidth={0} minHeight={0} debounce={50}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-in" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-out" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-invest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="label" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false}
                 tickFormatter={(v: number) => formatINRCompact(v).replace("₹", "")} />
          <Tooltip
            cursor={{ stroke: "#3f3f46", strokeDasharray: "3 3" }}
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "#a1a1aa", marginBottom: 4 }}
            formatter={(v, name) => [formatINR(Number(v)), LABELS[String(name)] ?? String(name)]}
          />
          <Area type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2} fill="url(#grad-in)" isAnimationActive={false} />
          <Area type="monotone" dataKey="spend"  stroke="#fb7185" strokeWidth={2} fill="url(#grad-out)" isAnimationActive={false} />
          <Area type="monotone" dataKey="invest" stroke="#f472b6" strokeWidth={2} fill="url(#grad-invest)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
