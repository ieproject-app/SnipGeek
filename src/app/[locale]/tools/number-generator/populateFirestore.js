
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
// Daftar tugas untuk menghasilkan nomor berdasarkan input Anda.
const tasks = [
  // Data lama (Jan & Feb 2026)
  { category: 'HK.800', year: 2026, month: 2, start: 100, end: 199 },
  { category: 'HK.800', year: 2026, month: 1, start: 2322, end: 2421 },
  { category: 'HK.820', year: 2026, month: 1, start: 12782, end: 12881 },
  { category: 'HK.820', year: 2026, month: 2, start: 5251, end: 5350 },
  { category: 'UM.000', year: 2026, month: 1, start: 7535, end: 7634 },
  { category: 'UM.000', year: 2026, month: 2, start: 5351, end: 5450 },

  // Data baru dari pengguna (2025)
  { category: 'HK.800', year: 2025, month: 12, start: 15187, end: 15286 },
  { category: 'HK.800', year: 2025, month: 11, start: 11363, end: 11462 },
  { category: 'HK.800', year: 2025, month: 10, start: 8374, end: 8473 },
  { category: 'HK.820', year: 2025, month: 12, start: 9872, end: 9971 },
  { category: 'HK.820', year: 2025, month: 11, start: 6124, end: 6223 },
  { category: 'UM.000', year: 2025, month: 12, start: 20515, end: 20564 },
  { category: 'UM.000', year: 2025, month: 11, start: 11313, end: 11362 },

  // Data baru: Penetapan (Jan & Feb 2026)
  { category: 'LG.270', year: 2026, month: 1, start: 7640, end: 7669 },
  { category: 'LG.270', year: 2026, month: 2, start: 5462, end: 5491 },
  
  { category: 'HK.820', year: 2025, month: 10, start: 13599, end: 13698 },
  { category: 'UM.000', year: 2025, month: 10, start: 13699, end: 13748 },
  
  // Data baru dari pengguna (Feb 2025)
  { category: 'LG.270', year: 2025, month: 2, start: 11383, end: 11411 },
];

const REGION_CODE = 'TA-760103';
// Hanya akan mempopulasi untuk 'below_500m' karena 'above_500m' belum didukung UI.
const valueCategories = ['below_500m'];

async function populate() {
  const collectionRef = db.collection('availableNumbers');
  let totalGenerated = 0;

  console.log('===================================================');
  console.log('Memulai proses populasi data dengan nomor yang baru.');
  console.log('PERINGATAN: Skrip ini akan MENAMBAH data. Jika ingin mengganti total, hapus koleksi lama di Firebase Console terlebih dahulu.');
  console.log('===================================================');

  for (const task of tasks) {
    const { category, year, month, start, end } = task;

    for (const valueCategory of valueCategories) {
      console.log(`\n-> Memproses: Kategori=${category}, Periode=${month}-${year}, Nilai=${valueCategory}, Urutan=${start}-${end}`);
      
      const batch = db.batch();
      let generatedInBatch = 0;

      for (let i = start; i <= end; i++) {
        // Nomor urut sekarang menggunakan padding 5 digit
        const sequence = String(i).padStart(5, '0');
        
        const dateString = `${String(month).padStart(2, '0')}-${year}`;
        const fullNumberPlaceholder = `${sequence}/${category}/${REGION_CODE}/${dateString}`;

        const docData = {
          fullNumber: fullNumberPlaceholder,
          category: category,
          year: year,
          month: month,
          valueCategory: valueCategory,
          isUsed: false,
          assignedTo: null,
          assignedDate: null,
        };

        // Membuat ID dokumen yang unik
        const docId = `${category}-${year}-${month}-${valueCategory}-${sequence}`;
        const docRef = collectionRef.doc(docId);
        
        batch.set(docRef, docData);
        generatedInBatch++;
      }

      try {
        await batch.commit();
        console.log(`  [OK] Berhasil menyimpan ${generatedInBatch} nomor.`);
        totalGenerated += generatedInBatch;
      } catch (error) {
        console.error(`  [GAGAL] Gagal menyimpan batch untuk tugas ini:`, error);
      }
    }
  }

  console.log('===================================================');
  console.log(`Proses selesai. Total nomor yang berhasil dibuat: ${totalGenerated}.`);
  console.log('Anda sekarang dapat menghentikan skrip ini (Ctrl+C).');
}

populate().catch(error => {
    console.error("Terjadi kesalahan tak terduga selama proses populasi:", error);
});
