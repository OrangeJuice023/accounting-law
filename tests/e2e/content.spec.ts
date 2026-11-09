import { expect, test } from '@playwright/test';

test('content endpoints serve the full 2D registry', async ({ request }) => {
  const catalog = await request.get('/content/catalog.json');
  expect(catalog.ok()).toBeTruthy();
  const sources = (await catalog.json()).sourceDocuments as Array<{ origin: string; role: string; url?: string }>;
  expect(sources).toHaveLength(95);
  expect(sources.filter((s) => s.origin === 'course-file')).toHaveLength(21);
  const legal = sources.filter((s) => s.origin === 'legal-source');
  expect(legal).toHaveLength(74);
  for (const source of legal) expect(source.url).toMatch(/^https:\/\//);

  const questions = await request.get('/content/ba166/questions.json');
  expect(questions.ok()).toBeTruthy();
  const q = (await questions.json()) as Array<{ kind: string; editorialStatus: string }>;
  expect(q).toHaveLength(69);
  expect(q.filter((item) => item.kind === 'selfTest')).toHaveLength(47);
  expect(q.filter((item) => item.kind === 'iracHypo')).toHaveLength(22);
  expect(q.filter((item) => item.kind === 'mcq')).toHaveLength(0);
  expect(q.filter((item) => item.editorialStatus === 'source-backed')).toHaveLength(27);
  expect(q.filter((item) => item.editorialStatus === 'researched-draft')).toHaveLength(42);

  const flashcards = await request.get('/content/ba166/flashcards.json');
  expect(flashcards.ok()).toBeTruthy();
  expect((await flashcards.json()) as unknown[]).toHaveLength(202);

  const lessons = await request.get('/content/ba166/lessons/index.json');
  expect(lessons.ok()).toBeTruthy();
  expect(((await lessons.json()) as { lessons: unknown[] }).lessons).toHaveLength(85);
});
