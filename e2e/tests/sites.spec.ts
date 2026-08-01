import { expect, test } from '@playwright/test'
import { AuthHelper } from '../helpers/AuthHelper'

test('site switcher lists all sites and "Alle Sites" aggregates', async ({ page }) => {
  await new AuthHelper(page).login()

  const switcher = page.getByLabel('Site auswählen')
  await expect(switcher).toContainText('Alle Sites')
  await expect(switcher).toContainText('localhost')

  await switcher.selectOption('')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alle Sites')
})
