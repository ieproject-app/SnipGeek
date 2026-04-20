"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** ISO date strings. */
  publishDates: string[];
  /** Year to render. Default: current UTC year. */
  year?: number;
};

const DAY_MS = 86400000;

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** GitHub-style contribution heatmap: 53 columns × 7 rows (Mon–Sun). */
export function PostingHeatmap({ publishDates, year }: Props) {
  const currentYear = year ?? new Date().getUTCFullYear();

  const countsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const iso of publishDates) {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) continue;
      if (d.getUTCFullYear() !== currentYear) continue;
      const key = formatDate(d);
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [publishDates, currentYear]);

  // Start: first Monday on or before Jan 1 of the year.
  const jan1 = new Date(Date.UTC(currentYear, 0, 1));
  const jan1Dow = (jan1.getUTCDay() + 6) % 7; // Mon=0
  const start = new Date(jan1.getTime() - jan1Dow * DAY_MS);
  const end = new Date(Date.UTC(currentYear, 11, 31));

  const weeks: Date[][] = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor = new Date(cursor.getTime() + DAY_MS);
    }
    weeks.push(week);
  }

  const maxCount = Math.max(1, ...Object.values(countsByDate));

  const levelClass = (count: number) => {
    if (count === 0) return "bg-muted";
    const ratio = count / maxCount;
    if (ratio > 0.75) return "bg-emerald-600";
    if (ratio > 0.5) return "bg-emerald-500";
    if (ratio > 0.25) return "bg-emerald-400";
    return "bg-emerald-300";
  };

  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <div className="flex flex-col gap-[3px] pt-[18px] text-[9px] text-muted-foreground">
        {dayLabels.map((l, i) => (
          <div key={i} className="h-[11px] leading-[11px]">
            {l}
          </div>
        ))}
      </div>
      <div className="flex gap-[3px]">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-[3px]">
            {week.map((day, dIdx) => {
              const key = formatDate(day);
              const count = countsByDate[key] ?? 0;
              const inYear = day.getUTCFullYear() === currentYear;
              return (
                <div
                  key={dIdx}
                  title={`${key}${count ? ` · ${count} publish` : ""}`}
                  className={cn(
                    "h-[11px] w-[11px] rounded-[2px] transition-colors",
                    inYear ? levelClass(count) : "bg-transparent",
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
