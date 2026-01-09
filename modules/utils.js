// Shared utility helpers for site normalization and host matching

export function normalizeSite(site) {
  if (!site) return '';
  return String(site)
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

export function extractHostname(urlOrHost) {
  try {
    return new URL(urlOrHost).hostname;
  } catch {
    return String(urlOrHost);
  }
}

export function matchesHost(hostname, site) {
  const cleanSite = normalizeSite(site);
  if (!cleanSite) return false;
  return hostname === cleanSite || hostname.endsWith(`.${cleanSite}`);
}
