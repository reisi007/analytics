import { detectSite } from '../config'

export function currentSite(host?: string): string {
  return detectSite(host ?? window.location.host)
}
