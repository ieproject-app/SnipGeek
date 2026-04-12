import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth, assertFirebaseAdminReady } from '@/lib/firebase-admin';

// ─── Firebase Admin service access ──────────────────────────────────────────

/**
 * Asserts Firebase Admin is ready and returns the services.
 * Throws if not available — callers should wrap in try/catch.
 */
export function getAdminServices() {
    assertFirebaseAdminReady();

    if (!adminDb || !adminAuth) {
        throw new Error('Firebase Admin services are not available.');
    }

    return { adminDb, adminAuth };
}

/**
 * Returns only adminDb (for routes that don't need auth verification).
 */
export function getAdminDb() {
    assertFirebaseAdminReady();

    if (!adminDb) {
        throw new Error('Firebase Admin database is not available.');
    }

    return adminDb;
}

// ─── Admin authentication ───────────────────────────────────────────────────

export type AdminCheckResult =
    | { isAdmin: true; uid: string; email: string }
    | { isAdmin: false; uid?: string; email?: string };

/**
 * Verify the Bearer token from request headers and check if the user is admin.
 * Returns the result without sending a response — caller decides what to do.
 */
export async function verifyAdminFromRequest(
    req: NextRequest,
): Promise<AdminCheckResult> {
    const { adminAuth, adminDb } = getAdminServices();
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return { isAdmin: false };
    }

    try {
        const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
        const adminSnap = await adminDb.collection('roles_admin').doc(decoded.uid).get();
        const isAdmin = adminSnap.exists && adminSnap.data()?.role === 'admin';

        return {
            isAdmin,
            uid: decoded.uid,
            email: decoded.email || decoded.uid,
        };
    } catch {
        return { isAdmin: false };
    }
}

/**
 * Guard: returns a 401/403 NextResponse if the request is not from an admin.
 * Returns null if the user IS an admin (caller can proceed).
 */
export async function requireAdmin(
    req: NextRequest,
): Promise<NextResponse | null> {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await verifyAdminFromRequest(req);
    if (!result.isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return null; // Access granted
}

// ─── Shared number generator constants ──────────────────────────────────────

export const JUSTIFICATION_CATEGORY_FALLBACKS = ['LG.000', 'LG.270'] as const;

export function normalizeCategory(category: string): string {
    return category.trim().toUpperCase();
}

export function normalizeDocType(docType: string): string {
    return docType.trim().toUpperCase();
}

/**
 * For justification categories, returns a fallback search order.
 * For other categories, returns just the category itself.
 */
export function getCategorySearchOrder(category: string): string[] {
    const normalizedCategory = normalizeCategory(category);

    if ((JUSTIFICATION_CATEGORY_FALLBACKS as readonly string[]).includes(normalizedCategory)) {
        return [
            normalizedCategory,
            ...JUSTIFICATION_CATEGORY_FALLBACKS.filter((item) => item !== normalizedCategory),
        ];
    }

    return [normalizedCategory];
}
