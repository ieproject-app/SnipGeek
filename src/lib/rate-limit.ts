import * as admin from 'firebase-admin';
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

export async function checkRateLimit(ip: string, config: RateLimitConfig = DEFAULT_CONFIG): Promise<boolean> {
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
  const docRef = adminDb.collection('rate_limits').doc(ipHash);
  const now = Date.now();

  try {
    const doc = await docRef.get();
    
    if (!doc.exists) {
      await docRef.set({
        count: 1,
        resetAt: now + config.windowMs,
      });
      return true;
    }

    const data = doc.data();
    if (!data) return true;

    if (now > data.resetAt) {
      await docRef.set({
        count: 1,
        resetAt: now + config.windowMs,
      });
      return true;
    }

    if (data.count >= config.max) {
      return false;
    }

    await docRef.update({
      count: admin.firestore.FieldValue.increment(1),
    });
    return true;

  } catch (error) {
    console.error('[RateLimit] Firestore error:', error);
    return true; 
  }
}
