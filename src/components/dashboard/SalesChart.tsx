'use client';

import { TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SalesChartProps {
  data: Array<{ date: string; revenue: number }>;
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="rounded-2xl border border-rose-soft/20 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Revenus sur 7 jours</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Courbe douce des ventes récentes
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={285}>
        <AreaChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 6" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fontWeight: 500 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fontWeight: 500 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip
            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
            contentStyle={{
              backgroundColor: 'hsl(var(--card) / 0.9)',
              border: '1px solid hsl(var(--border-rose))',
              borderRadius: '12px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}