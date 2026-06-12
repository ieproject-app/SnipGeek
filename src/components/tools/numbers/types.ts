
export {
    DAILY_LIMIT,
    MAX_REQUEST_QUANTITY,
    MAX_TOTAL_QUANTITY,
    STATIC_DOCUMENT_CATEGORIES,
    createDateFromDateKey,
    formatDateKey,
    getMonthStart,
    normalizeCategory,
} from '@/lib/number-generator';
export type { ValueCategory } from '@/lib/number-generator';

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

export function createNewRequest(overrides: Partial<GenerationRequest> = {}): GenerationRequest {
    return {
        id: overrides.id ?? `req_${Date.now()}_${Math.random()}`,
        category: '',
        docType: '',
        docDate: overrides.docDate ?? new Date(),
        quantity: 1,
        ...overrides,
    };
}
