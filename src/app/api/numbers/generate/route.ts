import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices, verifyAdminFromRequest, normalizeCategory, normalizeDocType, getCategorySearchOrder } from '@/lib/api-helpers';
import { format } from 'date-fns';
import crypto from 'crypto';

const DAILY_LIMIT = 15;
const MAX_REQUEST_QUANTITY = 20;

interface GenerationRequestItem {
    category: string;
    docType: string;
    docDate: string; // ISO string
    quantity: number;
}

interface GeneratedResult {
    text: string;
    rawNumber: string;
    date: string;
    docType: string;
    isError?: boolean;
}

function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.headers.get('x-real-ip') || 'unknown';
}

function hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip + (process.env.IP_HASH_SALT || 'snipgeek')).digest('hex');
}

export async function GET(req: NextRequest) {
    try {
        const { adminDb } = getAdminServices();
        const ip = getClientIp(req);
        const ipHash = hashIp(ip);
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        const adminCheck = await verifyAdminFromRequest(req);

        if (adminCheck.isAdmin) {
            return NextResponse.json({ dailyCount: 0, dailyLimit: null, isAdmin: true });
        }

        const snap = await adminDb.collection('ipGenerationLimits').doc(ipHash).get();
        let dailyCount = 0;
        if (snap.exists && snap.data()?.lastGeneratedDate === todayStr) {
            dailyCount = snap.data()?.dailyCount ?? 0;
        }

        return NextResponse.json({ dailyCount, dailyLimit: DAILY_LIMIT, isAdmin: false });
    } catch (error) {
        console.error('[GET limit]', error);
        const message = error instanceof Error ? error.message : 'Generator publik belum siap.';
        return NextResponse.json({ dailyCount: 0, dailyLimit: DAILY_LIMIT, isAdmin: false, error: message }, { status: 503 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { adminDb, adminAuth } = getAdminServices();

        const body = await req.json();
        const { requests, valueCategory, idToken } = body as {
            requests: GenerationRequestItem[];
            valueCategory: string;
            idToken?: string;
        };

        if (!requests?.length || !valueCategory) {
            return NextResponse.json({ error: 'Body permintaan tidak valid.' }, { status: 400 });
        }

        for (const r of requests) {
            if (!r.category || !r.docType || !r.docDate || r.quantity < 1 || !Number.isInteger(r.quantity)) {
                return NextResponse.json({ error: 'Input tidak lengkap.' }, { status: 400 });
            }

            if (r.quantity > MAX_REQUEST_QUANTITY) {
                return NextResponse.json({ error: `Maksimal jumlah per permintaan adalah ${MAX_REQUEST_QUANTITY}.` }, { status: 400 });
            }
        }

        // ─── Resolve caller identity ─────────────────────────────────────────────
        let isAdmin = false;
        let assignedTo: string;
        const ip = getClientIp(req);
        const ipHash = hashIp(ip);

        if (idToken) {
            try {
                const decoded = await adminAuth.verifyIdToken(idToken);
                const adminSnap = await adminDb.collection('roles_admin').doc(decoded.uid).get();
                isAdmin = adminSnap.exists && adminSnap.data()?.role === 'admin';
                assignedTo = decoded.email || decoded.uid;
            } catch {
                // Invalid token — treat as anonymous
                assignedTo = `ip:${ipHash.slice(0, 12)}`;
            }
        } else {
            assignedTo = `ip:${ipHash.slice(0, 12)}`;
        }

        const todayStr = format(new Date(), 'yyyy-MM-dd');

        // ─── IP-based daily limit check (skip for admin) ─────────────────────────
        const limitRef = adminDb.collection('ipGenerationLimits').doc(ipHash);

        if (!isAdmin) {
            const limitSnap = await limitRef.get();
            if (limitSnap.exists) {
                const data = limitSnap.data()!;
                if (data.lastGeneratedDate === todayStr && data.dailyCount >= DAILY_LIMIT) {
                    return NextResponse.json({
                        error: `Batas generate harian (${DAILY_LIMIT}) telah tercapai. Coba lagi besok.`,
                        limitReached: true,
                        dailyCount: data.dailyCount,
                        dailyLimit: DAILY_LIMIT,
                    }, { status: 429 });
                }
            }
        }

        // ─── Run Firestore transaction ───────────────────────────────────────────
        const results: GeneratedResult[] = await adminDb.runTransaction(async (tx) => {
            // Re-check limit inside transaction to avoid race conditions
            let currentCount = 0;
            if (!isAdmin) {
                const limitSnap = await tx.get(limitRef);
                if (limitSnap.exists) {
                    const data = limitSnap.data()!;
                    if (data.lastGeneratedDate === todayStr) {
                        currentCount = data.dailyCount ?? 0;
                    }
                }
                if (currentCount >= DAILY_LIMIT) {
                    throw new Error(`Batas generate harian (${DAILY_LIMIT}) telah tercapai.`);
                }
            }

            const txResults: GeneratedResult[] = [];
            let actualGenerated = 0;
            const selectedDocIds = new Set<string>();
            const docsToAssign: Array<{ docRef: FirebaseFirestore.DocumentReference; normalizedDocType: string }> = [];

            for (const req of requests) {
                const docDate = new Date(req.docDate);
                const year = docDate.getFullYear();
                const month = docDate.getMonth() + 1;
                const normalizedDocType = normalizeDocType(req.docType);
                const categorySearchOrder = getCategorySearchOrder(req.category);

                const remaining = isAdmin ? 999 : (DAILY_LIMIT - currentCount - actualGenerated);
                const processQty = Math.min(req.quantity, remaining);

                if (processQty <= 0 && !isAdmin) {
                    for (let i = 0; i < req.quantity; i++) {
                        txResults.push({ text: 'KUOTA HABIS', rawNumber: '', date: req.docDate, docType: req.docType, isError: true });
                    }
                    continue;
                }

                const matchedDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];

                for (const category of categorySearchOrder) {
                    if (matchedDocs.length >= processQty) {
                        break;
                    }

                    const queryLimit = Math.min(1000, (processQty - matchedDocs.length) + selectedDocIds.size + 20);

                    const query = adminDb.collection('availableNumbers')
                        .where('category', '==', category)
                        .where('year', '==', year)
                        .where('month', '==', month)
                        .where('valueCategory', '==', valueCategory)
                        .where('isUsed', '==', false)
                        .limit(queryLimit);

                    const snap = await tx.get(query);
                    for (const docSnap of snap.docs) {
                        if (selectedDocIds.has(docSnap.id)) {
                            continue;
                        }

                        selectedDocIds.add(docSnap.id);
                        matchedDocs.push(docSnap);

                        if (matchedDocs.length >= processQty) {
                            break;
                        }
                    }
                }

                for (const docSnap of matchedDocs) {
                    const fullNum = docSnap.data().fullNumber as string;
                    txResults.push({
                        text: fullNum.replace('{DOCTYPE}', normalizedDocType),
                        rawNumber: fullNum.replace('{DOCTYPE} ', ''),
                        date: req.docDate,
                        docType: normalizedDocType,
                    });
                    docsToAssign.push({
                        docRef: docSnap.ref,
                        normalizedDocType,
                    });
                    actualGenerated++;
                }

                const missing = req.quantity - matchedDocs.length;
                for (let i = 0; i < missing; i++) {
                    txResults.push({ text: 'STOK HABIS', rawNumber: '', date: req.docDate, docType: normalizedDocType, isError: true });
                }
            }

            const assignedDate = new Date().toISOString();
            docsToAssign.forEach((item) => {
                tx.update(item.docRef, {
                    isUsed: true,
                    assignedTo,
                    assignedDate,
                    assignedDocType: item.normalizedDocType,
                });
            });

            // Update IP limit counter
            if (!isAdmin && actualGenerated > 0) {
                const newCount = currentCount + actualGenerated;
                tx.set(limitRef, {
                    dailyCount: newCount,
                    lastGeneratedDate: todayStr,
                    lastIpFragment: ip.slice(0, 8),
                }, { merge: true });
            }

            return txResults;
        });

        // Fetch updated limit for UI
        let dailyCount = 0;
        if (!isAdmin) {
            const snap = await limitRef.get();
            if (snap.exists && snap.data()?.lastGeneratedDate === todayStr) {
                dailyCount = snap.data()?.dailyCount ?? 0;
            }
        }

        return NextResponse.json({
            results,
            dailyCount,
            dailyLimit: isAdmin ? null : DAILY_LIMIT,
            isAdmin,
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Terjadi kesalahan.';
        const isLimit = msg.includes('Batas generate harian');
        const isServiceUnavailable = msg.includes('Firebase Admin') || msg.includes('generator nomor') || msg.includes('default credentials');
        return NextResponse.json({ error: msg, limitReached: isLimit }, { status: isLimit ? 429 : isServiceUnavailable ? 503 : 500 });
    }
}
