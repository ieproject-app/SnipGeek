
'use client';

import { 
    collection, 
    doc, 
    writeBatch, 
    getDocs, 
    query, 
    limit as firestoreLimit 
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const ADMIN_EMAIL = 'iwan.efndi@gmail.com';
const REGION_CODE = 'TA-760103';

const tasks = [
  // Data target 2025 & 2026 dari skrip lama Mas
  { category: 'HK.800', year: 2026, month: 2, start: 100, end: 199 },
  { category: 'HK.800', year: 2026, month: 1, start: 2322, end: 2421 },
  { category: 'HK.820', year: 2026, month: 1, start: 12782, end: 12881 },
  { category: 'HK.820', year: 2026, month: 2, start: 5251, end: 5350 },
  { category: 'UM.000', year: 2026, month: 1, start: 7535, end: 7634 },
  { category: 'UM.000', year: 2026, month: 2, start: 5351, end: 5450 },
  { category: 'HK.800', year: 2025, month: 12, start: 15187, end: 15286 },
  { category: 'HK.800', year: 2025, month: 11, start: 11363, end: 11462 },
  { category: 'HK.800', year: 2025, month: 10, start: 8374, end: 8473 },
  { category: 'HK.820', year: 2025, month: 12, start: 9872, end: 9971 },
  { category: 'HK.820', year: 2025, month: 11, start: 6124, end: 6223 },
  { category: 'UM.000', year: 2025, month: 12, start: 20515, end: 20564 },
  { category: 'UM.000', year: 2025, month: 11, start: 11313, end: 11362 },
  { category: 'LG.270', year: 2026, month: 1, start: 7640, end: 7669 },
  { category: 'LG.270', year: 2026, month: 2, start: 5462, end: 5491 },
  { category: 'HK.820', year: 2025, month: 10, start: 13599, end: 13698 },
  { category: 'UM.000', year: 2025, month: 10, start: 13699, end: 13748 },
  { category: 'LG.270', year: 2025, month: 2, start: 11383, end: 11411 },
];

/**
 * Client-side action to populate Firestore numbers using batches.
 * Sesuai dengan format di screenshot Mas.
 */
export async function populateDatabaseAction(userEmail: string | null) {
    if (userEmail !== ADMIN_EMAIL) {
        throw new Error("Unauthorized: Hanya Iwan Efendi yang bisa mempopulasi database.");
    }

    const { firestore } = initializeFirebase();
    const colRef = collection(firestore, 'availableNumbers');
    
    let totalCreated = 0;

    for (const task of tasks) {
        const { category, year, month, start, end } = task;
        
        let batch = writeBatch(firestore);
        let batchCount = 0;

        for (let i = start; i <= end; i++) {
            const sequence = String(i).padStart(5, '0');
            const dateString = `${String(month).padStart(2, '0')}-${year}`;
            
            // Format fullNumber sesuai screenshot (dengan placeholder {DOCTYPE})
            const fullNumber = `{DOCTYPE} ${sequence}/${category}/${REGION_CODE}/${dateString}`;
            
            // Buat ID dokumen yang konsisten agar tidak ada duplikat jika tombol ditekan 2x
            const docId = `${category}-${year}-${month}-below_500m-${sequence}`;
            const docRef = doc(firestore, 'availableNumbers', docId);

            batch.set(docRef, {
                fullNumber,
                category,
                year, // Number type
                month, // Number type
                valueCategory: 'below_500m',
                isUsed: false,
                assignedTo: "",
                assignedDate: ""
            });

            batchCount++;
            totalCreated++;

            // Commit batch setiap 450 dokumen (Limit Firestore 500)
            if (batchCount === 450) {
                await batch.commit();
                batch = writeBatch(firestore);
                batchCount = 0;
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }
    }

    return totalCreated;
}
