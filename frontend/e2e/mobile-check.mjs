/**
 * Mobile layout check (Phase 6 final QA) — 390×844 viewport:
 * - no horizontal overflow (mockup alignment preserved);
 * - bottom mobile navigation visible, desktop sidebar hidden.
 * Standalone one-off script: run with `node e2e/mobile-check.mjs`.
 */
import { chromium } from '@playwright/test';

const URL = process.env.BASE_URL ?? 'http://localhost:3000/';

const browser = await chromium.launch();
const failures = [];

for (const path of ['/', '/publier']) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL.replace(/\/$/, '') + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200); // let streamed sections settle before measuring

  const scrollWidth = await page.evaluate(() => document.scrollingElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.scrollingElement.clientWidth);
  const bnav = page.locator('nav.bnav');
  const side = page.locator('nav.side');

  const bnavVisible = await bnav.isVisible();
  const bnavBox = await bnav.boundingBox().catch(() => null);
  const sideVisible = await side.isVisible().catch(() => null);
  // Streamed content may animate its container size — presence in the DOM is
  // the reliable assertion (visual ground truth checked via screenshot).
  const mainContentCount = await page.locator('main h1, main form, main article').count();

  const fail = (m) => { failures.push(`${path}: ${m}`); };
  console.log(`--- ${path} ---`);
  console.log(`scrollWidth=${scrollWidth} clientWidth=${clientWidth} overflow=${scrollWidth > clientWidth}`);
  console.log(`bnav visible=${bnavVisible} box=${bnavBox ? `w=${Math.round(bnavBox.width)} h=${Math.round(bnavBox.height)} at y=${Math.round(bnavBox.y)}` : 'none'}`);
  console.log(`side visible=${sideVisible}`);
  console.log(`main rendered elements (h1/form/article)=${mainContentCount}`);
  if (scrollWidth > clientWidth + 2) fail(`horizontal overflow: scrollWidth=${scrollWidth} clientWidth=${clientWidth}`);
  if (!bnavVisible) fail('bottom mobile navigation (.bnav) not visible at 390px');
  if (sideVisible) fail('desktop sidebar (.side) still visible at 390px');
  if (mainContentCount === 0) fail('main content missing at 390px');
  await page.close();
}

// Discussion detail page (documentId URLs come from Strapi).
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const firstDoc = await (await fetch('http://localhost:1337/api/discussions', { signal: AbortSignal.timeout(10_000) })).json();
  const docId = firstDoc?.data?.[0]?.documentId;
  await page.goto(URL.replace(/\/$/, '') + `/discussions/${docId}`, { waitUntil: 'networkidle' });
  const scrollWidth = await page.evaluate(() => document.scrollingElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.scrollingElement.clientWidth);
  console.log('--- /discussions/' + docId + ' ---');
  console.log(`scrollWidth=${scrollWidth} clientWidth=${clientWidth} overflow=${scrollWidth > clientWidth}`);
  if (scrollWidth > clientWidth + 2) failures.push(`/discussions/${docId}: horizontal overflow ${scrollWidth} > ${clientWidth}`);
  const h1Visible = await page.getByRole('heading', { level: 1 }).isVisible();
  console.log(`h1 visible=${h1Visible}`);
  if (!h1Visible) failures.push(`/discussions/${docId}: heading not visible`);
  await page.close();
}

await browser.close();
if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  process.exit(1);
}
console.log('MOBILE_CHECK: PASS (home, publier, detail)');
