import { describe, expect, test } from 'vitest';
import { generateCode } from './utilities';

const WRAP = 26 ** 6;
const START = 1790265298950;

describe('generateCode', () => {
  test('returns six capital letters', () => {
    for (let i = 0; i < 500; i++) expect(generateCode(START + i)).toMatch(/^[A-Z]{6}$/);
  });

  test('is determined by the creation time', () => {
    expect(generateCode(START)).toBe(generateCode(START));
    expect(generateCode(START)).not.toBe(generateCode(START + 1));
  });

  test('gives every millisecond in the window its own code', () => {
    const codes = new Set();
    for (let i = 0; i < 200000; i++) codes.add(generateCode(START + i));

    // No database check backs this up any more, so uniqueness has to come from
    // the encoding being reversible.
    expect(codes.size).toBe(200000);
  });

  test('changes every letter from one millisecond to the next', () => {
    // The point of multiplying by SCRAMBLE. Encoding the timestamp directly
    // would leave games created moments apart with lookalike codes, and a
    // mistyped character would drop a player into a stranger's live lobby.
    for (let i = 0; i < 5000; i++) {
      const [a, b] = [generateCode(START + i), generateCode(START + i + 1)];
      const shared = [...a].filter((letter, idx) => letter === b[idx]);
      expect(shared).toEqual([]);
    }
  });

  test('uses the whole alphabet at every position', () => {
    const seen = Array.from({ length: 6 }, () => new Set());
    for (let i = 0; i < 1000; i++)
      [...generateCode(START + i)].forEach((letter, idx) => seen[idx].add(letter));

    // Guards two ways of getting this wrong: a modulo of 25 that can never
    // reach Z, and encodings that leave the leading letters frozen for days.
    seen.forEach(letters => expect(letters.size).toBe(26));
  });

  test('only repeats a code after the 3.575 day wrap', () => {
    expect(WRAP / 86400000).toBeCloseTo(3.575, 3);
    expect(generateCode(START + WRAP)).toBe(generateCode(START));
    expect(generateCode(START + WRAP - 1)).not.toBe(generateCode(START));
  });
});
