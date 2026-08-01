import { i18n } from '@lingui/core'
import { I18nProvider as LinguiI18nProvider } from '@lingui/react'
import type { ReactNode } from 'react'
import { messages as deMessages } from '../../locale/de/messages.po'
import { messages as enMessages } from '../../locale/en/messages.po'

export type Locale = 'de' | 'en'

export function detectLocale(): Locale {
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')
    ? 'en'
    : 'de'
}

i18n.load({ de: deMessages, en: enMessages })
i18n.activate(detectLocale())

export function I18nProvider({ children }: { children: ReactNode }) {
  return <LinguiI18nProvider i18n={i18n}>{children}</LinguiI18nProvider>
}
