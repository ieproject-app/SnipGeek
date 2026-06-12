import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/api-helpers';
import {
    buildStockSummary,
    type DynamicDocumentCategory,
    type StockDocument,
    type ValueCategory,
} from '@/lib/number-generator';

function isValueCategory(value: string): value is ValueCategory {
    return value === 'below_500m' || value === 'above_500m';
}

function getStockErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : 'Stok nomor belum bisa dimuat.';

    if (
        process.env.NODE_ENV !== 'production' &&
        (message.includes('Could not load the default credentials') ||
            message.includes('Firebase Admin belum siap di local development') ||
            message.includes('default credentials'))
    ) {
        return 'Firebase Admin belum siap di local development. Isi FIREBASE_CLIENT_EMAIL dan FIREBASE_PRIVATE_KEY di .env.local untuk menampilkan matriks stok.';
    }

    return message;
}

export async function GET(req: NextRequest) {
    try {
        const db = getAdminDb();
        const requestedValueCategoryParam = req.nextUrl.searchParams.get('valueCategory')?.trim() || 'below_500m';
        const requestedValueCategory = isValueCategory(requestedValueCategoryParam)
            ? requestedValueCategoryParam
            : 'below_500m';
        const [numbersSnap, dynamicCategoriesSnap] = await Promise.all([
            db.collection('availableNumbers')
                .where('isUsed', '==', false)
                .where('valueCategory', '==', requestedValueCategory)
                .get(),
            db.collection('documentTypeConfig').get(),
        ]);

        return NextResponse.json(buildStockSummary(
            numbersSnap.docs.map((doc) => doc.data() as StockDocument),
            dynamicCategoriesSnap.docs.map((doc) => doc.data() as DynamicDocumentCategory),
        ));
    } catch (error) {
        console.error('[GET stock]', error);
        return NextResponse.json({ error: getStockErrorMessage(error) }, { status: 503 });
    }
}
