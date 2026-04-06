import { NextResponse } from 'next/server';
import { adminDb, assertFirebaseAdminReady } from '@/lib/firebase-admin';

const STATIC_DOCUMENT_CATEGORIES: Record<string, { name: string; types: string[] }> = {
    'UM.000': { name: 'Umum', types: ['ND UT'] },
    'HK.800': { name: 'Hukum', types: ['BAUT', 'LAUT', 'BA ABD', 'BA REKON'] },
    'HK.820': { name: 'Amandemen', types: ['AMD PERTAMA', 'AMD KEDUA', 'AMD KETIGA', 'AMD KEEMPAT', 'AMD PENUTUP'] },
    'LG.270': { name: 'Penetapan', types: ['PENETAPAN'] },
    'LG.000': { name: 'Justifikasi', types: ['JUSTIFIKASI'] },
};

type StockMatrix = Record<string, Record<string, number>>;

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

export async function GET() {
    try {
        const db = getAdminDb();
        const [numbersSnap, dynamicCategoriesSnap] = await Promise.all([
            db.collection('availableNumbers').where('isUsed', '==', false).get(),
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

            dynamicCategories[data.category] = {
                name: data.name,
                types: Array.isArray(data.types) ? data.types : [],
            };
        });

        const mergedCategories = { ...STATIC_DOCUMENT_CATEGORIES, ...dynamicCategories };
        const categoryCodes = Object.keys(mergedCategories);
        const matrix: StockMatrix = {};

        categoryCodes.forEach((category) => {
            matrix[category] = {};
            allPeriods.forEach((period) => {
                matrix[category][period] = 0;
            });
        });

        numbersSnap.forEach((doc) => {
            const data = doc.data() as { category?: string; year?: number; month?: number };

            if (!data.category || !data.year || !data.month) {
                return;
            }

            const category = data.category;
            const year = data.year;
            const month = data.month;

            if (year !== 2025 && year !== 2026) {
                return;
            }

            const periodKey = `${year}-${String(month).padStart(2, '0')}`;

            if (!matrix[category]) {
                matrix[category] = {};
                allPeriods.forEach((period) => {
                    matrix[category][period] = 0;
                });
                categoryCodes.push(category);
            }

            if (typeof matrix[category][periodKey] === 'number') {
                matrix[category][periodKey] += 1;
            }
        });

        return NextResponse.json({
            periods2025,
            periods2026,
            categories: categoryCodes,
            matrix,
        });
    } catch (error) {
        console.error('[GET stock]', error);
        const message = error instanceof Error ? error.message : 'Stok nomor belum bisa dimuat.';
        return NextResponse.json({ error: message }, { status: 503 });
    }
}
