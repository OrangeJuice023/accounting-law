import { expect, test } from '@playwright/test';

test('self-tests: 15 keyed questions with reveal + self-mark', async ({ page }) => {
  await page.goto('/practice/self-tests');
  const cards = page.locator('article[id^="q.instest."]');
  await expect(cards).toHaveCount(15);

  const first = cards.first();
  await expect(first.getByText('Original answer key')).toHaveCount(0);
  await first.getByRole('button', { name: 'Reveal answer key' }).click();
  await expect(first.getByText('Original answer key')).toBeVisible();
  await expect(first.getByText('Transcribed verbatim from the source reviewer.')).toBeVisible();
  await first.getByRole('button', { name: 'knew', exact: true }).click();
  await expect(first.getByRole('button', { name: 'knew', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('self-test attempt persists after refresh', async ({ page }) => {
  await page.goto('/practice/self-tests');
  const first = page.locator('article[id^="q.instest."]').first();
  await first.getByRole('button', { name: 'Reveal answer key' }).click();
  await expect(first.getByText('Original answer key')).toBeVisible();
  await page.reload();
  await expect(page.locator('article[id^="q.instest."]').first().getByText('Original answer key')).toBeVisible();
});

test('case analysis: 12 hypos with progressive hints, no solutions', async ({ page }) => {
  await page.goto('/practice/case-analysis');
  const cards = page.locator('article[id^="q.hypo."]');
  await expect(cards).toHaveCount(12);

  const first = cards.first();
  await expect(first.getByText('No model solution exists in the sources')).toBeVisible();
  // Hints unlock in IRAC order: conclusion locked until earlier sections reveal.
  await expect(first.getByRole('button', { name: /Reveal Conclusion hint/ })).toBeDisabled();
  await first.getByRole('button', { name: /Reveal Issue hint/ }).click();
  await expect(first.getByText('Hint — Issue')).toBeVisible();
  await expect(first.getByRole('button', { name: /Reveal Rule hint/ })).toBeEnabled();
  // No fabricated solutions anywhere: no solution headings, reveal buttons, or keys.
  await expect(first.getByRole('button', { name: /solution|answer key/i })).toHaveCount(0);
  await expect(first.getByRole('heading', { name: /model solution|answer key/i })).toHaveCount(0);
});

test('exam bank is honestly empty with a path back', async ({ page }) => {
  await page.goto('/practice/exam-bank');
  await expect(page.getByRole('heading', { name: 'No MCQ bank yet' })).toBeVisible();
  await expect(page.getByText(/zero multiple-choice questions in the sources/)).toBeVisible();
  await page.getByRole('link', { name: /source-backed self-tests instead/ }).click();
  await expect(page).toHaveURL(/\/practice\/self-tests$/);
});
