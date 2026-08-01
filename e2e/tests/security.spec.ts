import { expect, test, type APIRequestContext } from '@playwright/test'
import { AuthHelper } from '../helpers/AuthHelper'
import { SiteHelper, bearerAuth } from '../helpers/SiteHelper'

const MULTI_SITE = 'e2e-multi.local'
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

test('Mehr-Site-Aggregation liefert exakte Summen (inkl. www→Apex)', async ({ page, request }) => {
  const token = await siteHelper.login()

  const aggregateSite = `e2e-aggregate-${Date.now()}`
  await siteHelper.ensureSite(aggregateSite)

  const range = siteHelper.utcRange()

  await siteHelper.track(`https://${aggregateSite}/`, {
    type: 'pageview',
    url: `https://${aggregateSite}/page-a`,
    title: 'Page A',
  })
  await siteHelper.track(`https://${aggregateSite}/`, {
    type: 'pageview',
    url: `https://${aggregateSite}/page-b`,
    title: 'Page B',
  })

  const wwwUrl = 'https://www.reisinger.pictures/e2e-www-test'
  await siteHelper.track('https://www.reisinger.pictures/', {
    type: 'pageview',
    url: wwwUrl,
    title: 'Www Apex Test',
  })

  const aggregate = await siteHelper.summary({ site: aggregateSite, ...range })
  expect(aggregate.totals.pageviews).toBe(2)
  expect(aggregate.totals.events).toBe(0)

  const reisinger = await siteHelper.summary({ site: 'reisinger.pictures', ...range })
  expect(reisinger.top_pages.some((page) => page.url === wwwUrl)).toBe(true)

  const sitesRes = await request.get('/ingest/stats/sites', { headers: bearerAuth(token) })
  expect(sitesRes.status()).toBe(200)
  const sites = (await sitesRes.json()) as string[]

  let pageviews = 0
  let events = 0
  for (const site of sites) {
    const current = await siteHelper.summary({ site, ...range })
    pageviews += current.totals.pageviews
    events += current.totals.events
  }

  const all = await siteHelper.summary(range)
  expect(all.totals.pageviews).toBe(pageviews)
  expect(all.totals.events).toBe(events)

  await new AuthHelper(page).login()
  await page.getByLabel('Site auswählen').selectOption(aggregateSite)
  const pageviewsStat = page.locator('.stat', { hasText: 'Seitenaufrufe' }).locator('.stat-value')
  await expect(pageviewsStat).toHaveText('2')
})

test('getracktes Event erscheint auf der Events-Seite', async ({ page }) => {
  await siteHelper.login()
  await siteHelper.ensureSite(MULTI_SITE)

  const eventUrl = `https://${MULTI_SITE}/track-test`
  await siteHelper.track(`https://${MULTI_SITE}/`, {
    type: 'event',
    name: 'security-click',
    url: eventUrl,
    payload: { source: 'e2e' },
  })

  await new AuthHelper(page).login()
  await page.goto('/events')
  await page.getByLabel('Site auswählen').selectOption(MULTI_SITE)

  const row = page.getByRole('row', { name: new RegExp(eventUrl) }).first()
  await expect(row).toContainText('security-click')
})
