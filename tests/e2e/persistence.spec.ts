import { expect, test } from '@playwright/test';

const LESSON = '/review/block-a/sales/topic/sales.concept/lesson/sales.concept';

test('lesson completion persists across refresh', async ({ page }) => {
  await page.goto(LESSON);
  await expect(page.getByRole('heading', { name: 'The contract of sale' }).first()).toBeVisible();
  const toggle = page.getByRole('button', { name: /Mark as completed|Completed/ });
  if ((await toggle.textContent())?.includes('Mark as completed')) {
    await toggle.click();
  }
  await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();
});

test('bookmark persists and appears on the progress page', async ({ page }) => {
  await page.goto(LESSON);
  const toggle = page.getByRole('button', { name: /Bookmark$/ });
  if ((await toggle.getAttribute('aria-pressed')) !== 'true') {
    await toggle.click();
  }
  await page.goto('/progress');
  await expect(page.getByText('The contract of sale: concept, elements, stages').first()).toBeVisible();
});

test('mobile layout shows bottom-tab navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const tabs = page.getByRole('navigation', { name: 'Primary' });
  await expect(tabs.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(tabs.getByRole('link', { name: 'Practice' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hi, Mary Joy Caparida!' })).toBeVisible();
});
