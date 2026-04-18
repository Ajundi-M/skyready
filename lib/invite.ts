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
