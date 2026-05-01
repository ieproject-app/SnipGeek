import { describe, it, expect } from 'vitest';
import {
  parseDate,
  formatDate,
  formatDateForStorage,
  formatDateKey,
  sanitizeIdPart,
  buildEmployeeDocId,
  parseEmployeeRows,
  docRules,
  EMPLOYEE_HISTORY_COLLECTION,
  type Pejabat,
} from './types';

describe('employee-history/types', () => {

  describe('parseDate', () => {
    it('parses dd/mm/yyyy correctly', () => {
      const d = parseDate('15/03/2024');
      expect(d.getDate()).toBe(15);
      expect(d.getMonth()).toBe(2); // 0-indexed
      expect(d.getFullYear()).toBe(2024);
    });

    it('handles year 9999 as far-future date', () => {
      const d = parseDate('31/12/9999');
      expect(d.getFullYear()).toBe(9999);
    });

    it('returns NaN for empty string', () => {
      const d = parseDate('');
      expect(isNaN(d.getTime())).toBe(true);
    });

    it('returns NaN for invalid input', () => {
      const d = parseDate('invalid');
      expect(isNaN(d.getTime())).toBe(true);
    });
  });

  describe('formatDateForStorage', () => {
    it('formats date as dd/mm/yyyy', () => {
      const d = new Date(2024, 2, 5); // March 5, 2024
      expect(formatDateForStorage(d)).toBe('05/03/2024');
    });

    it('pads single-digit day and month', () => {
      const d = new Date(2024, 0, 1); // Jan 1
      expect(formatDateForStorage(d)).toBe('01/01/2024');
    });
  });

  describe('formatDateKey', () => {
    it('formats date as yyyymmdd', () => {
      const d = new Date(2024, 2, 15); // March 15
      expect(formatDateKey(d)).toBe('20240315');
    });

    it('pads correctly', () => {
      const d = new Date(2024, 0, 1);
      expect(formatDateKey(d)).toBe('20240101');
    });
  });

  describe('formatDate', () => {
    it('returns localized date string', () => {
      const d = new Date(2024, 2, 15);
      const result = formatDate(d, 'id-ID');
      expect(result).toContain('2024');
      expect(result).toContain('15');
    });

    it('returns N/A for invalid date', () => {
      expect(formatDate(new Date('invalid'))).toBe('N/A');
    });
  });

  describe('sanitizeIdPart', () => {
    it('lowercases and replaces non-alphanumeric chars', () => {
      expect(sanitizeIdPart('MGR KONSTRUKSI')).toBe('mgr-konstruksi');
    });

    it('trims leading/trailing hyphens', () => {
      expect(sanitizeIdPart('--hello--')).toBe('hello');
    });

    it('returns x for empty string', () => {
      expect(sanitizeIdPart('')).toBe('x');
    });

    it('handles undefined-like input', () => {
      expect(sanitizeIdPart(undefined as unknown as string)).toBe('x');
    });
  });

  describe('buildEmployeeDocId', () => {
    it('builds underscore-separated id', () => {
      const pejabat: Pejabat = {
        nik: '12345',
        tglMulai: new Date(2024, 0, 1),
        tglSelesai: new Date(2024, 11, 31),
        grupJabatan: 'MGR KONSTRUKSI',
        nama: 'Test',
        jabatan: 'Manager',
      };
      const id = buildEmployeeDocId(pejabat);
      expect(id).toBe('12345_20240101_20241231_mgr-konstruksi');
    });
  });

  describe('parseEmployeeRows', () => {
    it('parses tab-separated rows', () => {
      const raw = 'GM\t01/01/2024\t31/12/2024\tJohn Doe\tGeneral Manager\t12345';
      const result = parseEmployeeRows(raw);
      expect(result).toHaveLength(1);
      expect(result[0].nama).toBe('John Doe');
      expect(result[0].nik).toBe('12345');
      expect(result[0].grupJabatan).toBe('GM');
    });

    it('skips header row', () => {
      const raw = [
        'Grup Jabatan\tTgl Mulai\tTgl Selesai\tNama\tJabatan\tNIK',
        'GM\t01/01/2024\t31/12/2024\tJohn Doe\tGeneral Manager\t12345',
      ].join('\n');
      const result = parseEmployeeRows(raw);
      expect(result).toHaveLength(1);
    });

    it('skips lines with fewer than 6 columns', () => {
      const raw = 'GM\t01/01/2024\t31/12/2024\tJohn Doe\tManager';
      const result = parseEmployeeRows(raw);
      expect(result).toHaveLength(0);
    });

    it('returns empty array for empty input', () => {
      expect(parseEmployeeRows('')).toEqual([]);
    });

    it('handles multiple rows', () => {
      const raw = [
        'GM\t01/01/2024\t31/12/2024\tAlice\tGM\t111',
        'SM\t01/01/2024\t31/12/2024\tBob\tSM\t222',
      ].join('\n');
      const result = parseEmployeeRows(raw);
      expect(result).toHaveLength(2);
      expect(result[0].nama).toBe('Alice');
      expect(result[1].nama).toBe('Bob');
    });
  });

  describe('constants', () => {
    it('has correct collection name', () => {
      expect(EMPLOYEE_HISTORY_COLLECTION).toBe('employee_history');
    });

    it('docRules has expected keys', () => {
      expect(docRules).toHaveProperty('ND UT');
      expect(docRules).toHaveProperty('BAST');
      expect(docRules['BAST']).toContain('GM');
    });
  });
});
