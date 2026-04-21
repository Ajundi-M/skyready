import { describe, it, expect } from 'vitest';
import {
  generateInviteCode,
  inviteExpiry,
  normalizeInviteCode,
} from '../invite';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// XXXX-XXXX-XXXX where X ∈ CHARSET (excludes I, O, 0, 1 to prevent visual ambiguity)
const CODE_RE =
  /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;

describe('generateInviteCode', () => {
  it('produces the XXXX-XXXX-XXXX format', () => {
    expect(generateInviteCode()).toMatch(CODE_RE);
  });

  it('uses only the allowed charset — excludes O, I, 0, 1 to prevent visual ambiguity', () => {
    for (let i = 0; i < 100; i++) {
      const chars = generateInviteCode().replace(/-/g, '');
      for (const ch of chars) {
        expect(CHARSET, `character "${ch}" must be in CHARSET`).toContain(ch);
      }
    }
  });

  it('never includes excluded characters', () => {
    const excluded = ['O', 'I', '0', '1'];
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode();
      for (const ch of excluded) {
        expect(code, `code should not contain "${ch}"`).not.toContain(ch);
      }
    }
  });

  it('generates unique codes across 200 calls', () => {
    const codes = new Set(
      Array.from({ length: 200 }, () => generateInviteCode()),
    );
    expect(codes.size).toBe(200);
  });
});

describe('inviteExpiry', () => {
  it('returns a date approximately 48 hours from now', () => {
    const before = Date.now();
    const expiry = inviteExpiry();
    const after = Date.now();
    const H48 = 48 * 60 * 60 * 1000;
    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + H48);
    expect(expiry.getTime()).toBeLessThanOrEqual(after + H48 + 5);
  });

  it('is strictly in the future — satisfies the claim_invite_code `expires_at > now()` guard', () => {
    expect(inviteExpiry() > new Date()).toBe(true);
  });

  it('returns a new Date instance on each call', () => {
    const a = inviteExpiry();
    const b = inviteExpiry();
    expect(a).not.toBe(b);
  });
});

describe('normalizeInviteCode (claim flow wrapper)', () => {
  it('uppercases lowercase input to match the stored format', () => {
    expect(normalizeInviteCode('abcd-efgh-jklm')).toBe('ABCD-EFGH-JKLM');
  });

  it('strips leading and trailing whitespace', () => {
    expect(normalizeInviteCode('  ABCD-EFGH-JKLM  ')).toBe('ABCD-EFGH-JKLM');
  });

  it('is idempotent — normalising an already-normalised code is a no-op', () => {
    const code = generateInviteCode();
    expect(normalizeInviteCode(code)).toBe(code);
    expect(normalizeInviteCode(normalizeInviteCode(code))).toBe(code);
  });

  it('produces a code that matches the canonical format after lowercasing and padding', () => {
    const raw = '  ' + generateInviteCode().toLowerCase() + '  ';
    expect(normalizeInviteCode(raw)).toMatch(CODE_RE);
  });
});
