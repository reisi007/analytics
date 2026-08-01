import { describe, expect, it } from 'vitest'
import { detectSite, type SitesConfig } from './site'

const config: SitesConfig = {
  'reisinger.pictures': ['reisinger.pictures', 'www.reisinger.pictures', 'stats.reisinger.pictures'],
  'all-the.rest': [],
}

describe('detectSite', () => {
  it('returns the canonical site for stats.* dashboard subdomains', () => {
    expect(detectSite('stats.reisinger.pictures', config)).toBe('reisinger.pictures')
  })

  it('maps www.* to the apex domain', () => {
    expect(detectSite('www.reisinger.pictures', config)).toBe('reisinger.pictures')
  })

  it('keeps unrelated subdomains independent', () => {
    expect(detectSite('dev.reisinger.pictures', config)).toBe('dev.reisinger.pictures')
  })

  it('lowercases, trims and strips a leading www and port', () => {
    expect(detectSite('  WWW.Reisinger.Pictures:8443 ', config)).toBe('reisinger.pictures')
  })

  it('returns unknown hosts (incl. localhost) unchanged', () => {
    expect(detectSite('localhost', {})).toBe('localhost')
    expect(detectSite('example.com', {})).toBe('example.com')
  })

  it('maps an alias to an arbitrary site label', () => {
    const labeled: SitesConfig = {
      'Mein Blog': ['blog.example.com', 'www.blog.example.com'],
    }
    expect(detectSite('blog.example.com', labeled)).toBe('Mein Blog')
    expect(detectSite('www.blog.example.com', labeled)).toBe('Mein Blog')
  })

  it('treats the site label itself as no host (must be listed in aliases)', () => {
    expect(detectSite('all-the.rest', config)).toBe('all-the.rest')
  })
})
