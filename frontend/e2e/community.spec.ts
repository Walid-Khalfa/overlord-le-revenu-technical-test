import { expect, test, type Page } from '@playwright/test';

/**
 * End-to-end journeys of the community (Phase 5 — PDF §6 + task Step 4).
 *
 * Behavior-based assertions only (visible text, roles, URLs) — no
 * implementation details of React or of the data layer.
 *
 * Data safety: created discussions/replies carry the unique `[E2E-PH5-…]`
 * marker and are removable with `backend/tests/cleanup-ph5.sql`
 * (documented teardown; the DB is never reset, seed rows stay untouched).
 */

const DEMO = {
  identifier: 'demo_paul',
  password: process.env.SEED_USER_PASSWORD ?? 'Demo!LeRevenu2026',
};

const runStamp = Date.now().toString(36);

/** Unique marker for this run: allows a perfectly scoped SQL cleanup. */
const uniqueTitle = `[E2E-PH5-${runStamp}] Discussion creee par Playwright`;
const uniqueContent = `Contenu [E2E-PH5-${runStamp}] : le formulaire Next.js delegue la creation a Strapi, qui persiste dans PostgreSQL et revalidate le cache.`;
const uniqueReply = `[E2E-PH5-${runStamp}] Reponse publiee par le parcours E2E authentifie.`;

const memberLogin = async (page: Page, identifier: string) => {
  await page.getByPlaceholder(/Identifiant/).fill(identifier);
  await page.getByPlaceholder('Mot de passe').fill(DEMO.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByText('Connecté — vous pouvez publier et répondre')).toBeVisible();
};

test('journey 1 — anonymous visitor opens the community and sees real discussions', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'La communauté des lecteurs du Revenu' })).toBeVisible();
  // Real seeded data rendered server-side (not mock strings); ≥ 6 seed cards.
  await expect(page.locator('article.tcard').first()).toBeVisible();
  expect(await page.locator('article.tcard').count()).toBeGreaterThanOrEqual(6);
  await expect(page.getByText('demo_paul').first()).toBeVisible();
});

test('journey 2 — visitor filters by category and sorts (server-side)', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name: 'Impôts & fiscalité' })
    .click();
  await expect(page).toHaveURL(/espace=impots/);
  await expect(page.getByRole('heading', { name: 'Impôts & fiscalité' })).toBeVisible();

  await page.getByRole('link', { name: /Récentes/ }).click();
  await expect(page).toHaveURL(/tri=recent/);
  await expect(page.locator('article.tcard').first()).toBeVisible();

  // Empty state of the mockup when a space has no open question.
  await page.goto('/?espace=impots&tri=unanswered');
  await expect(page.getByText('Toutes les questions ont une réponse')).toBeVisible();
});

test('journey 3 — visitor opens a discussion and reads its replies', async ({ page }) => {
  await page.goto('/');
  await page.locator('article.tcard a').first().click();
  await expect(page).toHaveURL(/\/discussions\/[a-z0-9]+$/);
  await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();
  await expect(page.getByText(/réponse|Aucune réponse pour l’instant/).first()).toBeVisible();
});

test('journey 4 — anonymous visitor cannot publish (client validation, then server refusal)', async ({ page }) => {
  await page.goto('/publier');

  // 1. Client-side validation (≤ 10 chars title) blocks submission first.
  await page.locator('#c-title').fill('Tropcourt');
  await page.locator('#c-category').selectOption({ label: 'Bourse & actions' });
  await page.locator('#c-content').fill('Tentative anonyme avec un titre trop court.');
  await page.getByRole('button', { name: 'Publier la discussion' }).click();
  await expect(page.getByText('Le titre doit contenir au moins 10 caractères.')).toBeVisible();
  await expect(page).toHaveURL(/\/publier/); // no navigation happened

  // 2. A fully valid form still lands on the server-side auth refusal.
  await page.locator('#c-title').fill('[E2E-PH5] Tentative anonyme de publication');
  await page.locator('#c-content').fill('Un visiteur non connecte tente de publier une discussion complete.');
  await page.getByRole('button', { name: 'Publier la discussion' }).click();
  await expect(
    page.getByText("Connectez-vous dans l'espace membre ci-dessus pour publier.")
  ).toBeVisible();
  await expect(page).toHaveURL(/\/publier/); // still no creation
});

test('journeys 5→10 — authenticated member: login, create, listing, reply, persistence, logout', async ({ page }) => {
  // 5. Demo user logs in.
  await page.goto('/');
  await memberLogin(page, DEMO.identifier);

  // Security regression: the JWT lives in an HttpOnly cookie — invisible
  // to browser JavaScript, and owned by the session only.
  const jwtCookie = (await page.context().cookies()).find((c) => c.name === 'lr_strapi_jwt');
  expect(jwtCookie, 'session cookie must be set').toBeTruthy();
  expect(jwtCookie?.httpOnly, 'session cookie must be HttpOnly').toBe(true);
  const browserVisibleCookies = await page.evaluate(() => document.cookie);
  expect(browserVisibleCookies).not.toContain('lr_strapi_jwt');

  // 6. Authenticated creation through the real form.
  await page.goto('/publier');
  await page.locator('#c-title').fill(uniqueTitle);
  await page.locator('#c-category').selectOption({ label: 'Bourse & actions' });
  await page.locator('#c-content').fill(uniqueContent);
  await page.getByRole('button', { name: 'Publier la discussion' }).click();

  await page.waitForURL(/\/discussions\/[a-z0-9]+$/); // redirect to the new page
  await expect(page.getByRole('heading', { level: 1 })).toContainText(uniqueTitle);

  // 7. The new discussion appears in the listing.
  await page.goto('/?tri=recent');
  const listingCard = page.locator('article.tcard', { hasText: uniqueTitle });
  await expect(listingCard).toHaveCount(1);

  // Back on the detail page through the listing itself.
  await listingCard.locator('a[href^="/discussions/"]').first().click();
  await expect(page).toHaveURL(/\/discussions\/[a-z0-9]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(uniqueTitle);

  // 8. Authenticated reply on the freshly created page.
  await page.locator('#reply-body').fill(uniqueReply);
  await page.getByRole('button', { name: 'Publier ma réponse' }).click();
  await expect(page.getByText('Réponse publiée.')).toBeVisible();
  await expect(page.getByText(uniqueReply)).toBeVisible();

  // 9. The reply persists after a full reload (PostgreSQL, not local state).
  await page.reload();
  await expect(page.getByText(uniqueReply)).toBeVisible();

  // 10. Logout returns the panel to its login view.
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
});
