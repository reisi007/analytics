import { detectSite } from '../config'

export function currentSite(host?: string): string {
  return detectSite(host ?? window.location.host)
}

const defaultSite = detectSite(window.location.host)

export default defaultSite
