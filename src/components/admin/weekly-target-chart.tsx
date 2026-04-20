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
            formatter={(value: number) => [`${value} artikel`, "Jumlah"]}
            labelFormatter={(_, payload) => {
              const first = Array.isArray(payload) ? payload[0] : undefined;
              const p = first?.payload as { fullLabel?: string } | undefined;
              return p?.fullLabel ?? "";
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
