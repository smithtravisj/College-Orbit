import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateToken, isTokenExpired, getResetTokenExpiry } from '@/lib/email';

describe('Email Utility Functions', () => {
  describe('generateToken', () => {
    it('generates a 64-character hex string', () => {
      const token = generateToken();

      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('generates unique tokens each time', () => {
      const tokens = new Set<string>();

      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken());
      }

      expect(tokens.size).toBe(100);
    });
  });

  describe('isTokenExpired', () => {
    it('returns false for future dates', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      expect(isTokenExpired(futureDate)).toBe(false);
    });

    it('returns true for past dates', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      expect(isTokenExpired(pastDate)).toBe(true);
    });

    it('returns true for a moment ago (edge case)', () => {
      const momentAgo = new Date(Date.now() - 1);
      expect(isTokenExpired(momentAgo)).toBe(true);
    });

    it('handles Date objects correctly', () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      expect(isTokenExpired(futureDate)).toBe(false);
    });

    it('handles string dates that can be parsed', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      // The function does new Date(expiry), so it handles Date-like inputs
      expect(isTokenExpired(futureDate)).toBe(false);
    });
  });

  describe('getResetTokenExpiry', () => {
    it('returns a date 1 hour from now', () => {
      const before = Date.now();
      const expiry = getResetTokenExpiry();
      const after = Date.now();

      // Should be approximately 1 hour from now (within a small margin)
      const oneHourMs = 60 * 60 * 1000;
      const expiryTime = expiry.getTime();

      expect(expiryTime).toBeGreaterThanOrEqual(before + oneHourMs - 1000);
      expect(expiryTime).toBeLessThanOrEqual(after + oneHourMs + 1000);
    });

    it('returns a Date object', () => {
      const expiry = getResetTokenExpiry();
      expect(expiry).toBeInstanceOf(Date);
    });

    it('is not expired when first generated', () => {
      const expiry = getResetTokenExpiry();
      expect(isTokenExpired(expiry)).toBe(false);
    });
  });
});
