/**
 * Bulgarian (+359) phone-number helpers.
 *
 * Bulgarian mobile numbers are `+359` followed by 9 national digits, where the
 * first national digit is 8 or 9 (e.g. national `0888 123 456` → E.164
 * `+359888123456`). These helpers normalise arbitrary user input to E.164 for
 * the backend, format it for display, and validate it before sending an OTP.
 */

const BG_CC = '359';

/** Strip everything except digits and a single leading "+". */
function digitsOnly(input: string): string {
  return input.replace(/[^\d]/g, '');
}

/**
 * Convert loose user input into a canonical E.164 string (`+359XXXXXXXXX`).
 * Accepts `0888…`, `359…`, `+359…`, and inputs with spaces/dashes/parens.
 * Returns the best-effort `+359…` string even if not yet complete; callers
 * should gate on {@link isValidBgMobile}.
 */
export function normalizeBgPhone(input: string): string {
  let digits = digitsOnly(input);

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith(BG_CC)) {
    // Already has the country code.
    return `+${digits}`;
  }

  if (digits.startsWith('0')) {
    // National format with trunk "0" → drop it and prefix the country code.
    return `+${BG_CC}${digits.slice(1)}`;
  }

  if (digits.length === 0) {
    return '';
  }

  return `+${BG_CC}${digits}`;
}

/** The 9 national digits of a normalized BG number, or "" if not derivable. */
function nationalDigits(input: string): string {
  const normalized = normalizeBgPhone(input);
  if (!normalized.startsWith(`+${BG_CC}`)) {
    return '';
  }
  return normalized.slice(`+${BG_CC}`.length);
}

/**
 * Live display mask: `+359 88 123 4567`. Formats progressively as the user
 * types so partial input stays readable.
 */
export function formatBgPhone(input: string): string {
  const national = nationalDigits(input);

  if (national.length === 0) {
    // Preserve a lone "+" / "+3" / "+35" while the user is still typing it.
    return digitsOnly(input).length === 0 ? input.replace(/[^\d+\s]/g, '') : `+${BG_CC}`;
  }

  const trimmed = national.slice(0, 9);
  const parts = [trimmed.slice(0, 2), trimmed.slice(2, 5), trimmed.slice(5, 9)].filter(Boolean);

  return `+${BG_CC} ${parts.join(' ')}`.trim();
}

/** True when input is a complete, valid BG mobile number. */
export function isValidBgMobile(input: string): boolean {
  const national = nationalDigits(input);
  return /^[89]\d{8}$/.test(national);
}
