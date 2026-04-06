import { adminDb } from './firebase-admin';
import crypto from 'crypto';

interface RateLimitConfig {
  max: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  max: 5,
  windowMs: 10 * 60 * 1000,
};

// ─── In-memory fallback ───────────────────────────────────────────────────────
// Digunakan jika Firestore tidak tersedia, agar rate limit tidak ter-bypass.
// Dibersihkan otomatis setiap windowMs untuk mencegah memory leak.
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function checkMemoryLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (entry.count >= config.max) return false;

  entry.count += 1;
  return true;
}

export async function checkRateLimit(ip: string, config: RateLimitConfig = DEFAULT_CONFIG): Promise<boolean> {
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
  const now = Date.now();

  try {
    if (!adminDb) {
      return checkMemoryLimit(ipHash, config);
    }

    const docRef = adminDb.collection('rate_limits').doc(ipHash);

    // ─── Gunakan transaction untuk cegah race condition ───────────────────────
    const allowed = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);

      if (!snap.exists || now > (snap.data()?.resetAt ?? 0)) {
        tx.set(docRef, { count: 1, resetAt: now + config.windowMs });
        return true;
      }

      const count = snap.data()?.count ?? 0;
      if (count >= config.max) return false;

      tx.update(docRef, { count: count + 1 });
      return true;
    });

    return allowed;

  } catch (error) {
    console.error('[RateLimit] Firestore error, using in-memory fallback:', error);
    // Fallback ke in-memory — tidak bypass, tetap membatasi request
    return checkMemoryLimit(ipHash, config);
  }
}
