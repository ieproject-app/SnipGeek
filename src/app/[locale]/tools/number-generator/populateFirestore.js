
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

// --- KONFIGURASI ---
const tasks = [
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

const REGION_CODE = 'TA-760103';

async function populate() {
  const collectionRef = db.collection('availableNumbers');
  let totalGenerated = 0;

  console.log('Memulai proses populasi data...');

  for (const task of tasks) {
    const { category, year, month, start, end } = task;
    const batch = db.batch();
    let generatedInBatch = 0;

    console.log(`-> Memproses ${category} (${month}/${year})`);

    for (let i = start; i <= end; i++) {
      const sequence = String(i).padStart(5, '0');
      const dateString = `${String(month).padStart(2, '0')}-${year}`;
      const fullNumber = `${sequence}/${category}/${REGION_CODE}/${dateString}`;

      const docData = {
        fullNumber,
        category,
        year, // number
        month, // number
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
    console.log(`   [OK] +${generatedInBatch} nomor.`);
  }

  console.log(`Selesai! Total: ${totalGenerated} nomor berhasil disuntikkan.`);
}

populate().catch(console.error);
