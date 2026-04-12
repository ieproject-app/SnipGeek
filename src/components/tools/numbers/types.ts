
export const DAILY_LIMIT = 15;

export const STATIC_DOCUMENT_CATEGORIES: Record<string, { name: string; types: string[] }> = {
    'UM.000': { name: 'Umum', types: ['ND UT'] },
    'HK.800': { name: 'Hukum', types: ['BAUT', 'LAUT', 'BA ABD', 'BA REKON'] },
    'HK.820': { name: 'Amandemen', types: ['AMD PERTAMA', 'AMD KEDUA', 'AMD KETIGA', 'AMD KEEMPAT', 'AMD PENUTUP'] },
    'LG.270': { name: 'Penetapan', types: ['PENETAPAN'] },
    'LG.000': { name: 'Justifikasi', types: ['JUSTIFIKASI'] },
};

export type ValueCategory = 'below_500m' | 'above_500m';

export interface GenerationRequest {
    id: string;
    category: string;
    docType: string;
    docDate: Date | undefined;
    quantity: number;
}

export interface GeneratedResult {
    text: string;
    rawNumber: string;
    date: Date;
    docType: string;
    isError?: boolean;
}

export interface DynamicCategory {
    id: string;
    category: string;
    name: string;
    types: string[];
}

export interface StockMatrix {
    [category: string]: {
        [period: string]: number;
    };
}

export interface StockCategoryDetail {
    code: string;
    name: string;
    sourceCategories: string[];
}

export interface UserLimit {
    count: number;
    isLimited: boolean;
}

export const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export function normalizeCategory(category: string): string {
    return category.trim().toUpperCase();
}

export function createNewRequest(): GenerationRequest {
    return {
        id: `req_${Date.now()}_${Math.random()}`,
        category: '',
        docType: '',
        docDate: new Date(),
        quantity: 1,
    };
}
