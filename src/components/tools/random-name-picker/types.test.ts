import { describe, it, expect } from 'vitest';
import { getSeparatorPattern, sample } from './types';

describe('random-name-picker/types', () => {

  describe('getSeparatorPattern', () => {
    it('returns newline pattern by default', () => {
      const pattern = getSeparatorPattern('newline');
      expect('Alice\nBob'.split(pattern)).toEqual(['Alice', 'Bob']);
    });

    it('returns comma pattern', () => {
      const pattern = getSeparatorPattern('comma');
      expect('Alice, Bob, Charlie'.split(pattern)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('returns semicolon pattern', () => {
      const pattern = getSeparatorPattern('semicolon');
      expect('Alice; Bob; Charlie'.split(pattern)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('trims whitespace around separators', () => {
      const pattern = getSeparatorPattern('comma');
      expect('Alice ,  Bob'.split(pattern)).toEqual(['Alice', 'Bob']);
    });
  });

  describe('sample', () => {
    it('returns k items from array', () => {
      const arr = ['A', 'B', 'C', 'D', 'E'];
      const result = sample(arr, 3);
      expect(result).toHaveLength(3);
      result.forEach(item => expect(arr).toContain(item));
    });

    it('returns all items when k >= array length', () => {
      const arr = ['A', 'B'];
      const result = sample(arr, 5);
      expect(result).toHaveLength(2);
    });

    it('returns empty array for empty input', () => {
      expect(sample([], 3)).toEqual([]);
    });

    it('returns unique items (no duplicates)', () => {
      const arr = ['A', 'B', 'C', 'D', 'E'];
      const result = sample(arr, 5);
      const unique = new Set(result);
      expect(unique.size).toBe(result.length);
    });

    it('does not modify original array', () => {
      const arr = ['A', 'B', 'C'];
      const original = [...arr];
      sample(arr, 2);
      expect(arr).toEqual(original);
    });
  });
});
