
/**
 * WARNING: This script uses an external Service Account Key.
 * It may point to a different project than your current website.
 * Recommended: Use the /tools/maintenance page on the website instead.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// --- Inisialisasi Firebase Admin ---
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

console.log(`[!] MENYAMBUNG KE PROJECT ID: ${serviceAccount.project_id}`);

// --- KONFIGURASI TUGAS (Data HK.800 Jan 2025 Terbaru) ---
const tasks = [
  { category: 'HK.800', year: 2025, month: 1, start: 8338, end: 8437, regionCode: 'TA-851030' },
];

async function populate() {
  const collectionRef = db.collection('availableNumbers');
  let totalGenerated = 0;

  for (const task of tasks) {
    const { category, year, month, start, end, regionCode } = task;
    const batch = db.batch();
    let generatedInBatch = 0;

    console.log(`-> Memproses ${category} (${month}/${year}) - Region: ${regionCode}`);

    for (let i = start; i <= end; i++) {
      const sequence = String(i).padStart(5, '0');
      const dateString = `${String(month).padStart(2, '0')}-${year}`;
      const fullNumber = `{DOCTYPE} ${sequence}/${category}/${regionCode}/${dateString}`;

      const docData = {
        fullNumber,
        category,
        year,
        month,
        valueCategory: 'below_500m',
        isUsed: false,
        assignedTo: "",
        assignedDate: "",
      };

      const docId = `${category}-${year}-${month}-below_500m-${sequence}`;
      const docRef = collectionRef.doc(docId);
      
      batch.set(docRef, docData);
      generatedInBatch++;
    }

    await batch.commit();
    totalGenerated += generatedInBatch;
    console.log(`   [OK] +${generatedInBatch} nomor berhasil disuntik ke ${serviceAccount.project_id}.`);
  }

  console.log(`\nSelesai! Total: ${totalGenerated} nomor.`);
}

populate().catch(console.error);
