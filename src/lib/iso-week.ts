/**
 * ISO-week helpers used by the weekly posting target.
 * Week starts on Monday, ends on Sunday — matches ISO 8601.
 */

export type IsoWeek = {
  /** ISO year (may differ from calendar year near Jan/Dec). */
  year: number;
  /** ISO week number (1–53). */
  week: number;
  /** "YYYY-Www" string, e.g. "2026-W17". Stable sortable id. */
  key: string;
  /** Monday 00:00 of this ISO week, in UTC. */
  start: Date;
  /** Sunday 23:59:59.999 of this ISO week, in UTC. */
  end: Date;
};

/** Returns the Monday (00:00 UTC) of the ISO week containing `date`. */
export function startOfIsoWeek(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  // Mon=0 ... Sun=6
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Returns the Sunday 23:59:59.999 UTC of the ISO week containing `date`. */
export function endOfIsoWeek(date: Date): Date {
  const start = startOfIsoWeek(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

/** Returns the ISO year and week number of `date`. */
export function getIsoWeek(date: Date): IsoWeek {
  const start = startOfIsoWeek(date);
  const end = endOfIsoWeek(date);
  // Thursday of the week determines the ISO year
  const thursday = new Date(start);
  thursday.setUTCDate(thursday.getUTCDate() + 3);
  const year = thursday.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  const firstThursdayStart = startOfIsoWeek(firstThursday);
  const diff = (thursday.getTime() - firstThursdayStart.getTime()) / 86400000;
  const week = 1 + Math.round(diff / 7);
  return {
    year,
    week,
    key: `${year}-W${String(week).padStart(2, "0")}`,
    start,
    end,
  };
}

/** Returns the last `n` ISO weeks, most recent last. */
export function lastNIsoWeeks(n: number, anchor: Date = new Date()): IsoWeek[] {
  const result: IsoWeek[] = [];
  const start = startOfIsoWeek(anchor);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() - i * 7);
    result.push(getIsoWeek(d));
  }
  return result;
}

/**
 * Given a list of ISO date strings, returns a map of isoWeekKey -> count.
 */
export function groupByIsoWeek(dates: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const iso of dates) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const { key } = getIsoWeek(d);
    map[key] = (map[key] ?? 0) + 1;
  }
  return map;
}
