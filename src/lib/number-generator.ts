export const NUMBER_GENERATOR_TIME_ZONE = "Asia/Jakarta";

export const DAILY_LIMIT = 15;
export const MAX_REQUEST_QUANTITY = 20;
export const MAX_TOTAL_QUANTITY = 100;

export const STATIC_DOCUMENT_CATEGORIES: Record<
  string,
  { name: string; types: string[] }
> = {
  "UM.000": { name: "Umum", types: ["ND UT"] },
  "HK.800": { name: "Hukum", types: ["BAUT", "LAUT", "BA ABD", "BA REKON"] },
  "HK.820": {
    name: "Amandemen",
    types: [
      "AMD PERTAMA",
      "AMD KEDUA",
      "AMD KETIGA",
      "AMD KEEMPAT",
      "AMD PENUTUP",
    ],
  },
  "LG.270": { name: "Penetapan", types: ["PENETAPAN"] },
  "LG.000": { name: "Justifikasi", types: ["JUSTIFIKASI"] },
};

export type ValueCategory = "below_500m" | "above_500m";

export type ParsedDateKey = {
  dateKey: string;
  year: number;
  month: number;
  day: number;
};

export type StockDocument = {
  category?: string;
  year?: number;
  month?: number;
};

export type DynamicDocumentCategory = {
  category?: string;
  name?: string;
  types?: string[];
};

export type StockMatrix = Record<string, Record<string, number>>;

export type StockCategoryDetail = {
  code: string;
  name: string;
  sourceCategories: string[];
};

export type StockSummary = {
  periodsByYear: Record<string, string[]>;
  years: string[];
  categories: string[];
  categoryDetails: StockCategoryDetail[];
  rawMatrix: StockMatrix;
  matrix: StockMatrix;
};

const JUSTIFICATION_CATEGORY_FALLBACKS = ["LG.000", "LG.270"] as const;

export function normalizeCategory(category: string): string {
  return category.trim().toUpperCase();
}

export function getStockCategorySearchOrder(category: string): string[] {
  const normalizedCategory = normalizeCategory(category);

  if (
    (JUSTIFICATION_CATEGORY_FALLBACKS as readonly string[]).includes(
      normalizedCategory,
    )
  ) {
    return [
      normalizedCategory,
      ...JUSTIFICATION_CATEGORY_FALLBACKS.filter(
        (item) => item !== normalizedCategory,
      ),
    ];
  }

  return [normalizedCategory];
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string): ParsedDateKey | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return {
    dateKey: `${match[1]}-${match[2]}-${match[3]}`,
    year,
    month,
    day,
  };
}

export function createDateFromDateKey(value: string): Date {
  const parsed = parseDateKey(value);
  if (parsed) {
    return new Date(parsed.year, parsed.month - 1, parsed.day);
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getDateKeyInTimeZone(
  date = new Date(),
  timeZone = NUMBER_GENERATOR_TIME_ZONE,
): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return formatDateKey(date);
  }

  return `${year}-${month}-${day}`;
}

function buildPeriods(year: number, startMonth: number, endMonth: number) {
  const periods: string[] = [];

  for (let month = startMonth; month <= endMonth; month += 1) {
    periods.push(`${year}-${String(month).padStart(2, "0")}`);
  }

  return periods;
}

export function buildStockSummary(
  stockDocuments: StockDocument[],
  dynamicCategoryDocuments: DynamicDocumentCategory[],
): StockSummary {
  const yearMonths: Record<number, Set<number>> = {};

  stockDocuments.forEach((document) => {
    if (
      Number.isInteger(document.year) &&
      Number.isInteger(document.month) &&
      document.month! >= 1 &&
      document.month! <= 12
    ) {
      yearMonths[document.year!] ??= new Set();
      yearMonths[document.year!]!.add(document.month!);
    }
  });

  const discoveredYears = Object.keys(yearMonths).map(Number).sort((a, b) => a - b);
  const periodsByYear: Record<string, string[]> = {};
  const allPeriods: string[] = [];

  for (const year of discoveredYears) {
    const periods = buildPeriods(year, 1, 12);
    periodsByYear[String(year)] = periods;
    allPeriods.push(...periods);
  }

  const dynamicCategories: Record<string, { name: string; types: string[] }> = {};
  dynamicCategoryDocuments.forEach((document) => {
    if (!document.category || !document.name) {
      return;
    }

    dynamicCategories[normalizeCategory(document.category)] = {
      name: document.name,
      types: Array.isArray(document.types) ? document.types : [],
    };
  });

  const mergedCategories = { ...STATIC_DOCUMENT_CATEGORIES, ...dynamicCategories };
  const categoryCodes = Object.keys(mergedCategories);
  const rawMatrix: StockMatrix = {};
  const matrix: StockMatrix = {};

  categoryCodes.forEach((category) => {
    rawMatrix[category] = {};
    matrix[category] = {};
    allPeriods.forEach((period) => {
      rawMatrix[category][period] = 0;
      matrix[category][period] = 0;
    });
  });

  stockDocuments.forEach((document) => {
    if (!document.category || !document.year || !document.month) {
      return;
    }

    const category = normalizeCategory(document.category);
    const periodKey = `${document.year}-${String(document.month).padStart(2, "0")}`;

    if (!rawMatrix[category]) {
      rawMatrix[category] = {};
      matrix[category] = {};
      allPeriods.forEach((period) => {
        rawMatrix[category][period] = 0;
        matrix[category][period] = 0;
      });
      categoryCodes.push(category);
    }

    if (typeof rawMatrix[category][periodKey] === "number") {
      rawMatrix[category][periodKey] += 1;
    }
  });

  categoryCodes.forEach((category) => {
    const sourceCategories = getStockCategorySearchOrder(category);

    allPeriods.forEach((period) => {
      matrix[category][period] = sourceCategories.reduce((total, sourceCategory) => {
        return total + (rawMatrix[sourceCategory]?.[period] ?? 0);
      }, 0);
    });
  });

  const categoryDetails: StockCategoryDetail[] = categoryCodes.map((category) => ({
    code: category,
    name: mergedCategories[category]?.name ?? category,
    sourceCategories: getStockCategorySearchOrder(category),
  }));

  return {
    periodsByYear,
    years: discoveredYears.map(String),
    categories: categoryCodes,
    categoryDetails,
    rawMatrix,
    matrix,
  };
}
