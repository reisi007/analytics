import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { I18nProvider } from '../lib/i18n'

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => <I18nProvider>{children}</I18nProvider>,
    ...options,
  })
}
