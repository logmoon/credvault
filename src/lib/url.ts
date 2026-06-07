/**
 * Returns true only for URLs with a valid multi-label hostname (e.g. "google.com")
 * or localhost. Rejects bare single-label strings like "daws" or "foo".
 */
export function isValidUrl(s: string): boolean {
  if (!s || !s.trim()) return false;
  try {
    const normalized =
      s.startsWith('http://') || s.startsWith('https://') ? s : `https://${s}`;
    const { hostname } = new URL(normalized);
    return hostname === 'localhost' || /^[^.]+\.[^.]+/.test(hostname);
  } catch {
    return false;
  }
}
