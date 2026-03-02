
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

// Daftar nomor baru yang akan diinjek
const rawNumbers = [
  "10220/LG.270/TA-851030/10-2025",
  "10221/LG.270/TA-851030/10-2025",
  "10222/LG.270/TA-851030/10-2025",
  "10223/LG.270/TA-851030/10-2025",
  "10224/LG.270/TA-851030/10-2025",
  "10225/LG.270/TA-851030/10-2025",
  "10226/LG.270/TA-851030/10-2025",
  "10227/LG.270/TA-851030/10-2025",
  "10228/LG.270/TA-851030/10-2025",
  "10229/LG.270/TA-851030/10-2025",
  "10230/LG.270/TA-851030/10-2025",
  "10231/LG.270/TA-851030/10-2025",
  "10232/LG.270/TA-851030/10-2025",
  "10233/LG.270/TA-851030/10-2025",
  "10234/LG.270/TA-851030/10-2025",
  "10235/LG.270/TA-851030/10-2025",
  "10236/LG.270/TA-851030/10-2025",
  "10237/LG.270/TA-851030/10-2025",
  "10238/LG.270/TA-851030/10-2025",
  "10239/LG.270/TA-851030/10-2025",
  "10240/LG.270/TA-851030/10-2025",
  "10241/LG.270/TA-851030/10-2025",
  "10242/LG.270/TA-851030/10-2025",
  "10243/LG.270/TA-851030/10-2025",
  "10244/LG.270/TA-851030/10-2025",
  "10245/LG.270/TA-851030/10-2025",
  "10246/LG.270/TA-851030/10-2025",
  "10247/LG.270/TA-851030/10-2025",
  "10248/LG.270/TA-851030/10-2025"
];

async function injectBatch() {
  const collectionRef = db.collection('availableNumbers');
  let count = 0;
  const batch = db.batch();

  console.log(`Memulai injeksi ${rawNumbers.length} nomor baru...`);

  for (const line of rawNumbers) {
    const parts = line.split('/');
    if (parts.length < 4) continue;

    const sequence = parts[0];
    const category = parts[1];
    const dateParts = parts[3].split('-'); // [MM, YYYY]
    
    const month = parseInt(dateParts[0], 10);
    const year = parseInt(dateParts[1], 10);

    const docId = `${category}-${year}-${month}-below_500m-${sequence}`;
    const docRef = collectionRef.doc(docId);

    batch.set(docRef, {
      fullNumber: `{DOCTYPE} ${line}`,
      category: category,
      year: year,
      month: month,
      valueCategory: 'below_500m',
      isUsed: false,
      assignedTo: "",
      assignedDate: "",
    }, { merge: true });

    count++;
  }

  await batch.commit();
  console.log(`[OK] Berhasil menginjek ${count} nomor ke Firestore.`);
}

injectBatch().catch(console.error);
