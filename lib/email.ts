// The old /^[^\s@]+@[^\s@]+\.[^\s@]+$/ only excluded whitespace and "@", so
// emoji and other symbol characters (e.g. "😀@example.com") passed validation.
// This restricts local/domain parts to standard email characters.
export const EMAIL_REGEX =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}
