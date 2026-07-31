import { describe, expect, it } from 'vitest'
import { detectSite } from './config'

describe('detectSite', () => {
  it('returns the canonical site for apex domains', () => {
    expect(detectSite('reisinger.pictures')).toBe('reisinger.pictures')
    expect(detectSite('all-the.rest')).toBe('all-the.rest')
  })

  it('maps www.* to the apex domain', () => {
    expect(detectSite('www.reisinger.pictures')).toBe('reisinger.pictures')
    expect(detectSite('www.all-the.rest')).toBe('all-the.rest')
  })

  it('maps stats.* dashboard subdomains to the canonical site', () => {
    expect(detectSite('stats.reisinger.pictures')).toBe('reisinger.pictures')
    expect(detectSite('stats.all-the.rest')).toBe('all-the.rest')
  })

  it('keeps unrelated subdomains independent', () => {
    expect(detectSite('dev.reisinger.pictures')).toBe('dev.reisinger.pictures')
    expect(detectSite('blog.all-the.rest')).toBe('blog.all-the.rest')
  })

  it('lowercases and strips a leading www', () => {
    expect(detectSite('WWW.Reisinger.Pictures')).toBe('reisinger.pictures')
    expect(detectSite('STATS.ALL-THE.REST')).toBe('all-the.rest')
  })

  it('returns unknown hosts (incl. localhost) unchanged', () => {
    expect(detectSite('localhost')).toBe('localhost')
    expect(detectSite('localhost:5173')).toBe('localhost:5173')
    expect(detectSite('example.com')).toBe('example.com')
  })
})
