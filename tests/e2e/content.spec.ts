import { expect, test } from '@playwright/test';

test('content endpoints serve the full 2B registry', async ({ request }) => {
  const catalog = await request.get('/content/catalog.json');
  expect(catalog.ok()).toBeTruthy();
  expect((await catalog.json()).sourceDocuments).toHaveLength(21);

  const questions = await request.get('/content/ba166/questions.json');
  expect(questions.ok()).toBeTruthy();
  const q = (await questions.json()) as Array<{ kind: string }>;
  expect(q).toHaveLength(27);
  expect(q.filter((item) => item.kind === 'selfTest')).toHaveLength(15);
  expect(q.filter((item) => item.kind === 'iracHypo')).toHaveLength(12);
  expect(q.filter((item) => item.kind === 'mcq')).toHaveLength(0);

  const flashcards = await request.get('/content/ba166/flashcards.json');
  expect(flashcards.ok()).toBeTruthy();
  expect((await flashcards.json()) as unknown[]).toHaveLength(138);

  const lessons = await request.get('/content/ba166/lessons/index.json');
  expect(lessons.ok()).toBeTruthy();
  expect(((await lessons.json()) as { lessons: unknown[] }).lessons).toHaveLength(69);
});
