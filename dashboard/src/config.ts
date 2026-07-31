export const SITE_ALIASES: Record<string, string[]> = {
  'reisinger.pictures': ['reisinger.pictures', 'www.reisinger.pictures', 'stats.reisinger.pictures'],
  'all-the.rest': ['all-the.rest', 'www.all-the.rest', 'stats.all-the.rest'],
}

export function detectSite(host: string): string {
  const normalized = host.toLowerCase().replace(/^www\./, '')
  for (const [site, aliases] of Object.entries(SITE_ALIASES)) {
    if (aliases.includes(normalized)) {
      return site
    }
  }
  return normalized
}
