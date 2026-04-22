"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { lastNIsoWeeks, groupByIsoWeek } from "@/lib/iso-week";

export const WEEKLY_TARGET = 3;

type Props = {
  /** ISO date strings (date-only or full ISO). */
  publishDates: string[];
  /** Number of weeks to show. Default: 12. */
  weeks?: number;
  /** Tailwind height class for compact layouts. */
  heightClassName?: string;
};

export function WeeklyTargetChart({
  publishDates,
  weeks = 12,
  heightClassName = "h-72",
}: Props) {
  const isoWeeks = lastNIsoWeeks(weeks);
  const counts = groupByIsoWeek(publishDates);

  const data = isoWeeks.map((w) => {
    const count = counts[w.key] ?? 0;
    return {
      label: `W${String(w.week).padStart(2, "0")}`,
      fullLabel: `${w.key} (${w.start.toISOString().slice(5, 10)}–${w.end.toISOString().slice(5, 10)})`,
      count,
      onTarget: count >= WEEKLY_TARGET,
    };
  });

  return (
    <div className={`w-full ${heightClassName}`}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <ReferenceLine
            y={WEEKLY_TARGET}
            stroke="hsl(var(--accent))"
            strokeDasharray="4 4"
            label={{ value: `Target ${WEEKLY_TARGET}`, position: "right", fontSize: 10 }}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.5, radius: 4 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const entry = payload[0]?.payload as {
                count: number;
                fullLabel: string;
                onTarget: boolean;
              };
              return (
                <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 shadow-lg">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {label} · {entry.fullLabel}
                  </p>
                  <p
                    className={`mt-1 font-display text-base font-black tabular-nums ${
                      entry.onTarget ? "text-emerald-500" : entry.count === 0 ? "text-muted-foreground" : "text-destructive"
                    }`}
                  >
                    {entry.count} artikel
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {entry.onTarget
                      ? "✓ On target"
                      : entry.count === 0
                        ? "Belum ada publish"
                        : `${WEEKLY_TARGET - entry.count} lagi ke target`}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={
                  entry.onTarget
                    ? "hsl(142 71% 45%)" // emerald
                    : entry.count === 0
                      ? "hsl(0 0% 60% / 0.5)"
                      : "hsl(0 84% 60%)" // red
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
