export type SitesConfig = Record<string, string[]>

export function detectSite(host: string, sitesConfig: SitesConfig): string {
  const normalized = host
    .toLowerCase()
    .trim()
    .replace(/^www\./, '')
    .replace(/:\d+$/, '')
  for (const [site, aliases] of Object.entries(sitesConfig)) {
    if (normalized === site || aliases.includes(normalized)) {
      return site
    }
  }
  return normalized
}
