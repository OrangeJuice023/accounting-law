import { expect, test } from '@playwright/test';

test('deck list shows all-cards deck with 202 cards plus module decks', async ({ page }) => {
  await page.goto('/flashcards');
  await expect(page.getByRole('link', { name: /All flashcards/ })).toBeVisible();
  await expect(page.getByText('202 cards').first()).toBeVisible();
  const deckLinks = page.locator('a[href^="/flashcards/deck-"]');
  await expect(deckLinks).toHaveCount(17); // all-cards + 16 module decks
});

test('player reveals back, citation, and draft badge; navigates and marks', async ({ page }) => {
  await page.goto('/flashcards/deck-all');
  await expect(page.getByText('Card 1 of 202')).toBeVisible();

  // Flip reveals the answer side with citation and draft status.
  await page.getByRole('button', { name: /Tap to reveal the answer/ }).click();
  await expect(page.getByText('Tap to hide the answer')).toBeVisible();
  await expect(page.getByText('Draft — pending review').first()).toBeVisible();

  // Marking advances and counts.
  await page.getByRole('button', { name: 'Knew it', exact: true }).click();
  await expect(page.getByText('Card 2 of 202')).toBeVisible();
  await expect(page.getByText(/1 known/)).toBeVisible();

  // Prev/next navigate.
  await page.getByRole('button', { name: 'Prev', exact: true }).click();
  await expect(page.getByText('Card 1 of 202')).toBeVisible();

  // Shuffle resets to the first position.
  await page.getByRole('button', { name: 'Shuffle' }).click();
  await expect(page.getByText('Card 1 of 202')).toBeVisible();
});
