import { expect, test } from '@playwright/test';

/** Every registered route renders its page — never the NotFound component. */
const ROUTES: Array<{ path: string; heading: string }> = [
  { path: '/', heading: 'Hi, Mary Joy Caparida!' },
  { path: '/review', heading: 'Review Center' },
  { path: '/practice', heading: 'Practice Center' },
  { path: '/practice/self-tests', heading: 'Self-tests' },
  { path: '/practice/case-analysis', heading: 'Case analysis (IRAC)' },
  { path: '/practice/exam-bank', heading: 'No MCQ bank yet' },
  { path: '/flashcards', heading: 'Flashcards' },
  { path: '/flashcards/deck-all', heading: 'All flashcards' },
  { path: '/progress', heading: 'My Progress' },
  { path: '/sources', heading: 'Source Library' },
  { path: '/review/block-a/sales', heading: 'Law on Sales' },
  { path: '/review/block-c/secrecy', heading: 'Secrecy of Bank Deposits (RA 1405)' },
  { path: '/review/block-c/truth-in-lending', heading: 'Truth in Lending (RA 3765)' },
  { path: '/review/block-c/pdic', heading: 'PDIC Act (RA 3591, as amended)' },
  { path: '/review/block-f/labor', heading: 'Labor Code' },
  { path: '/review/block-f/sss', heading: 'Social Security (RA 11199)' },
];

for (const route of ROUTES) {
  test(`direct visit ${route.path} renders ${route.heading}`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible();
    await expect(page.getByText('This shelf is empty.')).toHaveCount(0);
  });
}

test('refresh on a nested route keeps the page (SPA fallback)', async ({ page }) => {
  await page.goto('/practice/case-analysis');
  await expect(page.getByRole('heading', { name: 'Case analysis (IRAC)' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Case analysis (IRAC)' })).toBeVisible();
  await expect(page.getByText('This shelf is empty.')).toHaveCount(0);
});

test('internal navigation reaches practice and flashcards', async ({ page }) => {
  await page.goto('/');
  // Href-based and visible-only: desktop sidebar and mobile tabs label these
  // links differently, and the hidden sidebar stays in the DOM on mobile.
  await page.locator('a[href="/practice"]:visible').first().click();
  await expect(page.getByRole('heading', { name: 'Practice Center' })).toBeVisible();
  await page.locator('a[href="/flashcards"]:visible').first().click();
  await expect(page.getByRole('heading', { name: 'Flashcards' })).toBeVisible();
});

test('unknown route shows a generic not-found page', async ({ page }) => {
  await page.goto('/no-such-page-xyz');
  await expect(page.getByText('This shelf is empty.')).toBeVisible();
  await expect(page.getByText(/Practice routes arrive with P1/)).toHaveCount(0);
});
