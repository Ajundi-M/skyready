import { randomBytes } from 'crypto';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateInviteCode(): string {
  const segment = () => {
    const bytes = randomBytes(4);
    return Array.from(bytes)
      .map((b) => CHARSET[b % CHARSET.length])
      .join('');
  };

  return `${segment()}-${segment()}-${segment()}`;
}

export function inviteExpiry(): Date {
  return new Date(Date.now() + 48 * 60 * 60 * 1000);
}

/**
 * Normalises a user-supplied invite code to the canonical stored format.
 *
 * Codes are always uppercased and stripped of surrounding whitespace before
 * any DB lookup or `claim_invite_code` RPC call.  Centralised here so the
 * rule can be tested and reused without duplicating inline string transforms.
 */
export function normalizeInviteCode(raw: string): string {
  return raw.toUpperCase().trim();
}
