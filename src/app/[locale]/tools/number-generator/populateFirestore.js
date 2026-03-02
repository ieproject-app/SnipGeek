
const fs = require('fs');
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

// Path ke file .txt
const filePath = path.join(__dirname, 'nomor_surat.txt');

async function populateFromFile() {
  const collectionRef = db.collection('availableNumbers');
  let totalInjected = 0;
  let batch = db.batch();
  let batchCounter = 0;

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');

    console.log(`Membaca ${filePath}...`);
    console.log(`Ditemukan ${lines.length} baris untuk diproses.`);

    for (const line of lines) {
      const trimmedLine = line.trim();
      // Lewati baris header atau baris kosong
      if (trimmedLine.startsWith('===') || trimmedLine === '') {
        continue;
      }

      // Format: 08338/HK.800/TA-851030/01-2025
      const parts = trimmedLine.split('/');
      if (parts.length !== 4) {
        console.warn(` -> [SKIPPING] Baris tidak valid: ${trimmedLine}`);
        continue;
      }
      
      const sequence = parts[0];
      const category = parts[1];
      const dateParts = parts[3].split('-'); // [MM, YYYY]

      if (dateParts.length !== 2) {
        console.warn(` -> [SKIPPING] Format tanggal tidak valid: ${parts[3]}`);
        continue;
      }

      const month = parseInt(dateParts[0], 10);
      const year = parseInt(dateParts[1], 10);

      // Buat fullNumber dengan placeholder {DOCTYPE} di depan.
      // Aplikasi akan mengganti {DOCTYPE} dengan jenis dokumen spesifik (misal: 'BAUT').
      const fullNumberForDB = `{DOCTYPE} ${trimmedLine}`;
      
      const docData = {
        fullNumber: fullNumberForDB,
        category: category,
        year: year,
        month: month,
        valueCategory: 'below_500m', // Asumsi default
        isUsed: false,
        assignedTo: "",
        assignedDate: "",
      };

      // Buat ID dokumen yang unik untuk mencegah duplikasi dan memungkinkan penimpaan.
      const docId = `${category}-${year}-${month}-below_500m-${sequence}`;
      const docRef = collectionRef.doc(docId);
      
      // Gunakan set dengan { merge: true } untuk membuat atau menimpa dokumen.
      batch.set(docRef, docData, { merge: true }); 
      batchCounter++;
      totalInjected++;

      // Batas operasi dalam satu batch adalah 500. Commit lebih awal untuk keamanan.
      if (batchCounter >= 499) {
        await batch.commit();
        console.log(`   [OK] ${batchCounter} nomor berhasil disuntik dalam satu batch.`);
        batch = db.batch(); // Buat batch baru
        batchCounter = 0;
      }
    }

    // Commit sisa data di batch terakhir.
    if (batchCounter > 0) {
      await batch.commit();
      console.log(`   [OK] ${batchCounter} nomor berhasil disuntik di batch terakhir.`);
    }

    console.log(`\nSelesai! Total: ${totalInjected} nomor telah berhasil diproses dan disuntik ke Firestore.`);

  } catch (error) {
    console.error("Terjadi kesalahan saat memproses file:", error);
  }
}

populateFromFile().catch(console.error);
