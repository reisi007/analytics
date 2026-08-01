import { expect, test, type APIRequestContext } from '@playwright/test'
import { AuthHelper } from '../helpers/AuthHelper'
import { SiteHelper, bearerAuth, uniqueSite } from '../helpers/SiteHelper'

const BASE_URL = 'http://localhost:8081'

let requestContext: APIRequestContext
let siteHelper: SiteHelper

test.beforeAll(async ({ playwright }) => {
  requestContext = await playwright.request.newContext({ baseURL: BASE_URL })
  siteHelper = new SiteHelper(requestContext)
})

test.afterAll(async () => {
  await siteHelper?.teardown()
  await requestContext?.dispose()
})

test('unbekannter Referrer wird mit 403 abgewiesen', async ({ request }) => {
  const res = await request.post('/ingest/track', {
    headers: { Referer: 'https://evil.example/', 'Content-Type': 'text/plain' },
    data: JSON.stringify({ type: 'pageview', url: 'https://evil.example/', title: 'Evil' }),
  })
  expect(res.status()).toBe(403)
})

test('ungültige Tokens werden mit 401 abgewiesen', async ({ request }) => {
  const summaryRes = await request.get('/ingest/stats/summary', {
    headers: { Authorization: 'Bearer invalid.jwt.token' },
  })
  expect(summaryRes.status()).toBe(401)

  const streamRes = await request.get('/ingest/stream?token=invalid.jwt.token')
  expect(streamRes.status()).toBe(401)
})

test('vollwertiges JWT am /stream wird abgewiesen (nur Stream-Token erlaubt)', async ({ request }) => {
  const loginRes = await request.post('/ingest/auth/login', {
    data: { email: 'admin@e2e.local', password: 'password' },
  })
  expect(loginRes.ok()).toBe(true)
  const { token } = (await loginRes.json()) as { token: string }

  const streamRes = await request.get(`/ingest/stream?token=${token}`)
  expect(streamRes.status()).toBe(403)
})

test('Mehr-Site-Aggregation liefert exakte Summen (inkl. www→Apex)', async ({ page, request }) => {
  const token = await siteHelper.login()

  const siteA = uniqueSite('e2e-aggregate-a')
  const siteB = uniqueSite('e2e-aggregate-b')
  await siteHelper.ensureSite(siteA)
  await siteHelper.ensureSite(siteB)

  const range = siteHelper.utcRange()

  await siteHelper.track(`https://${siteA}/`, {
    type: 'pageview',
    url: `https://${siteA}/page-a`,
    title: 'Page A',
  })
  await siteHelper.track(`https://${siteA}/`, {
    type: 'pageview',
    url: `https://${siteA}/page-b`,
    title: 'Page B',
  })

  // www→Apex: www.<siteA> wird auf siteA zusammengeführt
  const wwwUrl = `https://www.${siteA}/e2e-www-test`
  await siteHelper.track(`https://www.${siteA}/`, {
    type: 'pageview',
    url: wwwUrl,
    title: 'Www Apex Test',
  })

  await siteHelper.track(`https://${siteB}/`, {
    type: 'pageview',
    url: `https://${siteB}/page-b`,
    title: 'Page B',
  })

  const summaryA = await siteHelper.summary({ site: siteA, ...range })
  expect(summaryA.totals.pageviews).toBe(3)
  expect(summaryA.totals.events).toBe(0)
  expect(summaryA.top_pages.some((page) => page.url === wwwUrl)).toBe(true)

  const summaryB = await siteHelper.summary({ site: siteB, ...range })
  expect(summaryB.totals.pageviews).toBe(1)

  // "Alle Sites" enthält mindestens die Summe der eigenen Sites (robust gegen Parallel-/Fremddaten)
  const all = await siteHelper.summary(range)
  expect(all.totals.pageviews).toBeGreaterThanOrEqual(
    summaryA.totals.pageviews + summaryB.totals.pageviews,
  )

  const sitesRes = await request.get('/ingest/stats/sites', { headers: bearerAuth(token) })
  expect(sitesRes.status()).toBe(200)
  const sites = (await sitesRes.json()) as string[]
  expect(sites).toContain(siteA)
  expect(sites).toContain(siteB)

  await new AuthHelper(page).login()
  await page.getByLabel('Site auswählen').selectOption(siteA)
  const pageviewsStat = page.locator('.stat', { hasText: 'Seitenaufrufe' }).locator('.stat-value')
  await expect(pageviewsStat).toHaveText('3')
})

test('getracktes Event erscheint auf der Events-Seite', async ({ page }) => {
  const site = uniqueSite('e2e-multi')
  await siteHelper.login()
  await siteHelper.ensureSite(site)

  const eventUrl = `https://${site}/track-test`
  await siteHelper.track(`https://${site}/`, {
    type: 'event',
    name: 'security-click',
    url: eventUrl,
    payload: { source: 'e2e' },
  })

  await new AuthHelper(page).login()
  await page.goto('/events')
  await page.getByLabel('Site auswählen').selectOption(site)

  const row = page.getByRole('row', { name: new RegExp(eventUrl) }).first()
  await expect(row).toContainText('security-click')
})
