// Loose normalization used only to *suggest* likely duplicates (e.g. "Devi
// Mahatme" vs "DeviMahatme") — lowercase, strip whitespace/punctuation but
// keep all Unicode letters/digits (many names here are in Kannada script).
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}
