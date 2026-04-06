import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const snap = await adminDb.collection('documentTypeConfig').get();
        const categories = snap.docs.map(d => ({
            id: d.id,
            ...(d.data() as { category: string; name: string; types: string[] }),
        }));
        return NextResponse.json({ categories });
    } catch (error) {
        console.error('[GET categories]', error);
        return NextResponse.json({ categories: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
        const adminSnap = await adminDb.collection('roles_admin').doc(decoded.uid).get();
        if (!adminSnap.exists || adminSnap.data()?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { category, name, types } = body as { category: string; name: string; types: string[] };

        if (!category || !name || !Array.isArray(types) || types.length === 0) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        await adminDb.collection('documentTypeConfig').doc(category).set({ category, name, types }, { merge: true });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[POST category]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
        const adminSnap = await adminDb.collection('roles_admin').doc(decoded.uid).get();
        if (!adminSnap.exists || adminSnap.data()?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const catId = searchParams.get('id');
        if (!catId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        await adminDb.collection('documentTypeConfig').doc(catId).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DELETE category]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
