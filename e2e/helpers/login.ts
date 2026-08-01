import type { Page } from '@playwright/test'
import { AuthHelper } from './AuthHelper'

/**
 * Kompatibilitäts-Shim: alte Importe (`import { login } from '../helpers/login'`)
 * laufen über den zentralen AuthHelper.
 */
export async function login(
  page: Page,
  email = 'admin@e2e.local',
  password = 'password',
): Promise<void> {
  await new AuthHelper(page).login(email, password)
}
