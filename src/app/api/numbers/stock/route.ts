import { NextRequest, NextResponse } from 'next/server';
import { adminDb, assertFirebaseAdminReady } from '@/lib/firebase-admin';

const STATIC_DOCUMENT_CATEGORIES: Record<string, { name: string; types: string[] }> = {
    'UM.000': { name: 'Umum', types: ['ND UT'] },
    'HK.800': { name: 'Hukum', types: ['BAUT', 'LAUT', 'BA ABD', 'BA REKON'] },
    'HK.820': { name: 'Amandemen', types: ['AMD PERTAMA', 'AMD KEDUA', 'AMD KETIGA', 'AMD KEEMPAT', 'AMD PENUTUP'] },
    'LG.270': { name: 'Penetapan', types: ['PENETAPAN'] },
    'LG.000': { name: 'Justifikasi', types: ['JUSTIFIKASI'] },
};

const JUSTIFICATION_CATEGORY_FALLBACKS = ['LG.000', 'LG.270'] as const;

type StockMatrix = Record<string, Record<string, number>>;

type StockCategoryDetail = {
    code: string;
    name: string;
    sourceCategories: string[];
};

function normalizeCategory(category: string): string {
    return category.trim().toUpperCase();
}

function getStockCategorySources(category: string): string[] {
    const normalizedCategory = normalizeCategory(category);

    if ((JUSTIFICATION_CATEGORY_FALLBACKS as readonly string[]).includes(normalizedCategory)) {
        return [normalizedCategory, ...JUSTIFICATION_CATEGORY_FALLBACKS.filter(c => c !== normalizedCategory)];
    }

    return [normalizedCategory];
}

function getAdminDb() {
    assertFirebaseAdminReady();

    if (!adminDb) {
        throw new Error('Layanan Firebase Admin belum tersedia untuk stok nomor.');
    }

    return adminDb;
}

function buildPeriods(year: number, startMonth: number, endMonth: number) {
    const periods: string[] = [];

    for (let month = startMonth; month <= endMonth; month += 1) {
        periods.push(`${year}-${String(month).padStart(2, '0')}`);
    }

    return periods;
}

export async function GET(req: NextRequest) {
    try {
        const db = getAdminDb();
        const requestedValueCategory = req.nextUrl.searchParams.get('valueCategory')?.trim() || 'below_500m';
        const [numbersSnap, dynamicCategoriesSnap] = await Promise.all([
            db.collection('availableNumbers')
                .where('isUsed', '==', false)
                .where('valueCategory', '==', requestedValueCategory)
                .get(),
            db.collection('documentTypeConfig').get(),
        ]);

        const periods2025 = buildPeriods(2025, 1, 12);
        const periods2026 = buildPeriods(2026, 1, 3);
        const allPeriods = [...periods2025, ...periods2026];

        const dynamicCategories: Record<string, { name: string; types: string[] }> = {};
        dynamicCategoriesSnap.forEach((doc) => {
            const data = doc.data() as { category?: string; name?: string; types?: string[] };

            if (!data.category || !data.name) {
                return;
            }

             const normalizedCategory = normalizeCategory(data.category);

            dynamicCategories[normalizedCategory] = {
                name: data.name,
                types: Array.isArray(data.types) ? data.types : [],
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

        numbersSnap.forEach((doc) => {
            const data = doc.data() as { category?: string; year?: number; month?: number };

            if (!data.category || !data.year || !data.month) {
                return;
            }

            const category = normalizeCategory(data.category);
            const year = data.year;
            const month = data.month;

            if (year !== 2025 && year !== 2026) {
                return;
            }

            const periodKey = `${year}-${String(month).padStart(2, '0')}`;

            if (!rawMatrix[category]) {
                rawMatrix[category] = {};
                matrix[category] = {};
                allPeriods.forEach((period) => {
                    rawMatrix[category][period] = 0;
                    matrix[category][period] = 0;
                });
                categoryCodes.push(category);
            }

            if (typeof rawMatrix[category][periodKey] === 'number') {
                rawMatrix[category][periodKey] += 1;
            }
        });

        categoryCodes.forEach((category) => {
            const sourceCategories = getStockCategorySources(category);

            allPeriods.forEach((period) => {
                matrix[category][period] = sourceCategories.reduce((total, sourceCategory) => {
                    return total + (rawMatrix[sourceCategory]?.[period] ?? 0);
                }, 0);
            });
        });

        const categoryDetails: StockCategoryDetail[] = categoryCodes.map((category) => ({
            code: category,
            name: mergedCategories[category]?.name ?? category,
            sourceCategories: getStockCategorySources(category),
        }));

        return NextResponse.json({
            periods2025,
            periods2026,
            categories: categoryCodes,
            categoryDetails,
            rawMatrix,
            matrix,
        });
    } catch (error) {
        console.error('[GET stock]', error);
        const message = error instanceof Error ? error.message : 'Stok nomor belum bisa dimuat.';
        return NextResponse.json({ error: message }, { status: 503 });
    }
}
