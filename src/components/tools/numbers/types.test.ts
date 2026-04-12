import { describe, it, expect } from 'vitest';
import {
  getErrorMessage,
  normalizeCategory,
  DAILY_LIMIT,
  STATIC_DOCUMENT_CATEGORIES,
} from './types';

describe('numbers/types', () => {

  describe('getErrorMessage', () => {
    it('returns error message from Error instance', () => {
      const error = new Error('Something went wrong');
      expect(getErrorMessage(error, 'fallback')).toBe('Something went wrong');
    });

    it('returns fallback for non-Error', () => {
      expect(getErrorMessage('string error', 'fallback')).toBe('fallback');
      expect(getErrorMessage(42, 'fallback')).toBe('fallback');
      expect(getErrorMessage(null, 'fallback')).toBe('fallback');
      expect(getErrorMessage(undefined, 'fallback')).toBe('fallback');
    });
  });

  describe('normalizeCategory', () => {
    it('uppercases and trims', () => {
      expect(normalizeCategory('  hk.800  ')).toBe('HK.800');
    });

    it('handles already-normalized input', () => {
      expect(normalizeCategory('UM.000')).toBe('UM.000');
    });

    it('handles empty string', () => {
      expect(normalizeCategory('')).toBe('');
    });
  });

  describe('constants', () => {
    it('DAILY_LIMIT is a positive number', () => {
      expect(DAILY_LIMIT).toBeGreaterThan(0);
    });

    it('STATIC_DOCUMENT_CATEGORIES has expected structure', () => {
      expect(STATIC_DOCUMENT_CATEGORIES).toHaveProperty('UM.000');
      expect(STATIC_DOCUMENT_CATEGORIES['UM.000']).toHaveProperty('name');
      expect(STATIC_DOCUMENT_CATEGORIES['UM.000']).toHaveProperty('types');
      expect(Array.isArray(STATIC_DOCUMENT_CATEGORIES['UM.000'].types)).toBe(true);
    });

    it('all categories have non-empty types', () => {
      Object.entries(STATIC_DOCUMENT_CATEGORIES).forEach(([key, cat]) => {
        expect(cat.types.length, `${key} should have types`).toBeGreaterThan(0);
        expect(cat.name, `${key} should have a name`).toBeTruthy();
      });
    });
  });
});
