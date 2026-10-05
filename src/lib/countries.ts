/** "IT" → 🇮🇹 (regional indicator symbols). */
export function countryFlag(code: string): string {
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split('')
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
