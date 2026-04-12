import { parse, isValid } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// --- TYPE DEFINITIONS ---
export interface Pejabat {
  grupJabatan: string;
  tglMulai: Date;
  tglSelesai: Date;
  nama: string;
  jabatan: string;
  nik: string;
}

export interface DocRule {
  [key: string]: string[];
}

export interface DocQuery {
  id: number;
  docType: string;
  docDate: string;
  projectValue: number;
}

export interface GeneratedResult {
  [key: string]: Pejabat[];
}

export const EMPLOYEE_HISTORY_COLLECTION = 'employee_history';

// --- CONSTANTS ---
export const docRules: DocRule = {
  'ND UT': ['MGR KONSTRUKSI'],
  'BAUT LAUT': ['SM KONSTRUKSI', 'MGR KONSTRUKSI', 'GM'],
  'BA ABD': ['SM KONSTRUKSI', 'MGR KONSTRUKSI'],
  'BA REKON': ['MGR KONSTRUKSI', 'GM'],
  'BA MATERIAL': ['TL WH', 'MGR SS', 'SM KONSTRUKSI', 'MGR KONSTRUKSI'],
  'AMD PENUTUP': ['GM'],
  'BAST': ['GM'],
};

// --- HELPER FUNCTIONS ---
export const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [day, month, year] = dateStr.split('/').map(Number);
  if (isNaN(year)) return new Date();
  if (year === 9999) return new Date(9999, 11, 31);
  return new Date(year, month - 1, day);
};

export const tryParseDate = (text: string): Date | null => {
  if (!text) return null;
  const hasYear = /\b\d{4}\b/.test(text);
  const formats = hasYear
    ? ['d MMMM yyyy', 'd MMM yyyy', 'd/M/yyyy', 'd/M/yy']
    : ['d MMMM', 'd MMM'];
  const referenceDate = new Date();
  referenceDate.setHours(0, 0, 0, 0);
  for (const fmt of formats) {
    try {
      const parsedDate = parse(text, fmt, referenceDate, { locale: idLocale });
      if (isValid(parsedDate)) {
        parsedDate.setHours(0, 0, 0, 0);
        return parsedDate;
      }
    } catch { }
  }
  return null;
};

export const formatDate = (date: Date, locale: string = 'id-ID') => {
  if (!date || isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export const formatDateForStorage = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
};

export const formatDateKey = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${year}${month}${day}`;
};

export const sanitizeIdPart = (value: string): string =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'x';

export const buildEmployeeDocId = (pejabat: Pejabat): string => {
  return [
    sanitizeIdPart(pejabat.nik),
    formatDateKey(pejabat.tglMulai),
    formatDateKey(pejabat.tglSelesai),
    sanitizeIdPart(pejabat.grupJabatan),
  ].join('_');
};

export const parseEmployeeRows = (rawText: string): Pejabat[] => {
  if (!rawText) return [];

  return rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((line, idx) => {
      const parts = line.split('\t').map(part => part.trim());
      if (parts.length < 6) return null;

      const [grupJabatan, tglMulaiRaw, tglSelesaiRaw, nama, jabatan, ...nikParts] = parts;
      const nik = nikParts.join(' ').trim();

      const isHeader =
        idx === 0 &&
        /grup/i.test(grupJabatan) &&
        /mulai|start/i.test(tglMulaiRaw) &&
        /selesai|end/i.test(tglSelesaiRaw);
      if (isHeader) return null;

      const tglMulai = parseDate(tglMulaiRaw);
      const tglSelesai = parseDate(tglSelesaiRaw);
      if (!nama || isNaN(tglMulai.getTime()) || isNaN(tglSelesai.getTime())) return null;

      return {
        grupJabatan,
        tglMulai,
        tglSelesai,
        nama,
        jabatan,
        nik,
      };
    })
    .filter((item): item is Pejabat => Boolean(item));
};
