import crypto from 'crypto';

const PREFIX = 'OGE';

/**
 * Generates a unique order number in the format:
 *   OGE-YYYYMMDD-XXXXX
 *
 * - OGE     : Olive Grove Emporium prefix
 * - YYYYMMDD: current date
 * - XXXXX   : 5-character uppercase alphanumeric random string
 *
 * Collision probability is negligibly low (~60M combinations per day).
 */
export const generateOrderNumber = (): string => {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');

  const randomPart = crypto
    .randomBytes(4)
    .toString('base64url')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 5)
    .toUpperCase();

  return `${PREFIX}-${datePart}-${randomPart}`;
};
