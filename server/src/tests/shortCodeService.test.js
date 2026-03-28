const { encode, decode, generateShortCode, isValidUrl } = require('../../src/services/shortCodeService');

describe('shortCodeService', () => {

  // ── encode ────────────────────────────────────────────────────────────────
  describe('encode', () => {
    test('encodes 0 to first character', () => {
      expect(encode(0)).toBe('a');
    });

    test('encodes a known number correctly', () => {
      const code = encode(12345);
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });

    test('produces only Base62 characters', () => {
      const base62 = /^[a-zA-Z0-9]+$/;
      expect(base62.test(encode(99999))).toBe(true);
    });
  });

  // ── decode ────────────────────────────────────────────────────────────────
  describe('decode', () => {
    test('decode(encode(n)) returns n', () => {
      const n = 54321;
      expect(decode(encode(n))).toBe(n);
    });
  });

  // ── generateShortCode ─────────────────────────────────────────────────────
  describe('generateShortCode', () => {
    test('returns a 6-character string', () => {
      const code = generateShortCode();
      expect(code).toHaveLength(6);
    });

    test('contains only Base62 characters', () => {
      const base62 = /^[a-zA-Z0-9]{6}$/;
      expect(base62.test(generateShortCode())).toBe(true);
    });

    test('generates unique codes', () => {
      const codes = new Set(Array.from({ length: 100 }, () => generateShortCode()));
      // With 56 billion combinations, 100 codes should all be unique
      expect(codes.size).toBe(100);
    });
  });

  // ── isValidUrl ────────────────────────────────────────────────────────────
  describe('isValidUrl', () => {
    test('accepts valid http URL', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    test('accepts valid https URL', () => {
      expect(isValidUrl('https://www.google.com')).toBe(true);
    });

    test('accepts URL with path and query', () => {
      expect(isValidUrl('https://example.com/path?q=1')).toBe(true);
    });

    test('rejects plain text', () => {
      expect(isValidUrl('not a url')).toBe(false);
    });

    test('rejects URL without protocol', () => {
      expect(isValidUrl('www.google.com')).toBe(false);
    });

    test('rejects ftp protocol', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false);
    });

    test('rejects empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });
  });
});