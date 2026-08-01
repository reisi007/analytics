import { describe, expect, it } from 'vitest'
import { messages as deMessages } from '../../locale/de/messages.po'
import { messages as enMessages } from '../../locale/en/messages.po'
import { detectLocale } from './i18n'

function mockNavigatorLanguage(lang: string) {
  Object.defineProperty(navigator, 'language', { value: lang, configurable: true })
}

function firstText(value: unknown): string {
  return Array.isArray(value) && typeof value[0] === 'string' ? value[0] : String(value)
}

describe('detectLocale', () => {
  it('uses de for German browser locales', () => {
    mockNavigatorLanguage('de-DE')
    expect(detectLocale()).toBe('de')
  })

  it('uses en for English browser locales', () => {
    mockNavigatorLanguage('en-US')
    expect(detectLocale()).toBe('en')
  })
})

describe('English catalog', () => {
  it('has the same message keys as the German source catalog', () => {
    expect(Object.keys(enMessages).sort()).toEqual(Object.keys(deMessages).sort())
  })

  it('has no empty translations', () => {
    for (const key of Object.keys(enMessages)) {
      const text = firstText(enMessages[key])
      expect(text.length).toBeGreaterThan(0)
    }
  })

  it('translates "Alle Webseiten" to "All sites"', () => {
    const key = Object.entries(deMessages).find(
      ([, value]) => firstText(value) === 'Alle Webseiten',
    )?.[0]
    expect(key).toBeDefined()
    expect(firstText(enMessages[key!])).toBe('All sites')
  })
})
