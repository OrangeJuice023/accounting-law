import { expect, test } from '@playwright/test';

/** Phase 2D: research-backed modules render with provenance, citations, and practice. */

test('research-backed module page shows provenance and research notice', async ({ page }) => {
  await page.goto('/review/block-c/pdic');
  await expect(page.getByRole('heading', { name: 'PDIC Act (RA 3591, as amended)' })).toBeVisible();
  await expect(page.getByLabel('Provenance: Research-backed').first()).toBeVisible();
  await expect(page.getByText('Research-backed module:')).toBeVisible();
  await expect(page.getByLabel('Coverage: Covered').first()).toBeVisible();
});

test('research-backed lesson renders with citations to official sources', async ({ page }) => {
  await page.goto('/review/block-c/pdic/topic/pdic.policy/lesson/pdic.policy');
  await expect(page.getByRole('heading', { name: 'Policy and duty to insure' })).toBeVisible();
  await expect(page.getByLabel('Provenance: Research-backed').first()).toBeVisible();
  const chips = page.locator('button[aria-haspopup="dialog"]');
  await expect(chips.first()).toBeVisible();
  await chips.first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Official legal source')).toBeVisible();
  const official = dialog.getByRole('link', { name: /Open official source/ });
  await expect(official).toBeVisible();
  expect(await official.getAttribute('href')).toMatch(/^https:\/\//);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
});

test('researched self-test reveals answer plus explanation', async ({ page }) => {
  await page.goto('/practice/self-tests');
  const card = page.locator('article#q\\.labor\\.hours-exemptions');
  await expect(card.getByText('research-backed draft (not a professor question)')).toBeVisible();
  await card.getByRole('button', { name: 'Reveal answer key' }).click();
  await expect(card.getByText('Why this is the answer')).toBeVisible();
  await expect(card.getByText('not an official examination question')).toBeVisible();
});

test('researched hypo reveals hints then reference analysis', async ({ page }) => {
  await page.goto('/practice/case-analysis');
  const card = page.locator('article#q\\.pdic\\.irac-closure');
  await expect(card.getByText('Research-backed draft:')).toBeVisible();
  for (const section of ['Issue', 'Rule', 'Application', 'Conclusion']) {
    await card.getByRole('button', { name: new RegExp(`Reveal ${section} hint`) }).click();
  }
  const reveal = card.getByRole('button', { name: 'Reveal reference analysis' });
  await expect(reveal).toBeEnabled();
  await reveal.click();
  await expect(card.getByText('Reference analysis').first()).toBeVisible();
  await expect(card.getByText('not an official solution')).toBeVisible();
});

test('source library lists official legal sources with outbound links', async ({ page }) => {
  await page.goto('/sources');
  await expect(page.getByRole('heading', { name: 'Official legal sources (74)' })).toBeVisible();
  const first = page.getByRole('link', { name: /Open official source/ }).first();
  await expect(first).toBeVisible();
  expect(await first.getAttribute('href')).toMatch(/^https:\/\//);
});

test('footer attributes both reviewers and legal research', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/supplemental legal/)).toBeVisible();
  await expect(page.getByText(/every section cites its source file and page/)).toHaveCount(0);
});
