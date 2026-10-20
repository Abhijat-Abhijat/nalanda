import { test, expect } from '@playwright/test';
import { sqlCh1 } from '../src/content/sql/ch1';
import { aiWorld } from '../src/content/ai-engineer';

test('complete a SQL lesson, see XP, and keep progress after reload', async ({ page }) => {
  const lesson = sqlCh1.lessons[0];
  await page.goto('/');
  await page.getByRole('link', { name: /^SQL/ }).click();
  await page.getByRole('link', { name: lesson.title }).click();

  await page.getByRole('textbox', { name: 'SQL editor' }).fill('SELECT * FROM customers');
  await page.getByRole('button', { name: 'Check answer' }).first().click();
  await expect(page.getByText('Exercise complete.')).toBeVisible();

  const questions = page.locator('section[aria-label="Check"] section.question');
  for (const [i, q] of lesson.quiz.entries()) {
    const card = questions.nth(i);
    if (q.kind === 'choice') await card.getByLabel(q.options[q.answer], { exact: true }).check();
    else if (q.kind === 'fill') await card.getByRole('textbox').fill(q.answers[0]);
    else throw new Error('SQL lesson 1 quiz must use choice or fill questions');
    await card.getByRole('button', { name: 'Check answer' }).click();
  }

  await page.getByRole('button', { name: 'Next lesson' }).click();
  // The next lesson must start fresh: nothing is complete and its button is locked.
  await expect(page.getByText('Exercise complete.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeDisabled();
  const xp = page.getByText(/^\d+ XP$/);
  await expect(xp).not.toHaveText('0 XP');
  const before = await xp.textContent();
  await page.reload();
  await expect(page.getByText(/^\d+ XP$/)).toHaveText(before!);
});

test('keyboard: the first Tab stop is a link or button', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const tag = await page.evaluate(() => document.activeElement?.tagName);
  expect(['A', 'BUTTON']).toContain(tag);
});

test('an endless loop in a JS exercise shows the timeout message and the page stays usable', async ({ page }) => {
  const examsPassed = Object.fromEntries(aiWorld.chapters.map((c) => [`ai-engineer/${c.id}`, 100]));
  await page.addInitScript((passed) => {
    localStorage.setItem('nalanda.progress.v1', JSON.stringify({
      version: 1, xp: 0, streak: { count: 0, last: null }, lessonsDone: {}, attempts: {},
      examsPassed: passed,
      bossesPassed: {}, history: {}, review: [], badges: [], perfectQuizzes: 0, reviewCleared: 0,
    }));
  }, examsPassed);
  await page.goto('/#/w/ai-engineer/boss');
  await page.getByRole('textbox', { name: 'JavaScript editor' }).fill('function overlap(a,b){ while(true){} }');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Your code ran too long. Check for an endless loop.')).toBeVisible({ timeout: 6000 });
  await expect(page.getByRole('button', { name: 'Check answer' })).toBeEnabled();
});

test('a locked lesson typed into the URL shows the lock message', async ({ page }) => {
  await page.goto('/#/w/sql/asking-questions/l2');
  await page.reload();
  await expect(page.getByText('This lesson is locked.')).toBeVisible();
});

test('no horizontal scrolling at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const route of ['/', '/#/w/sql', '/#/w/git-shell', '/#/w/sql/asking-questions/l1', '/#/progress']) {
    await page.goto(route);
    await page.reload();
    await expect(page.locator('main h1').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect([route, overflow <= 0]).toEqual([route, true]);
  }
});

test('reduced motion turns animations off', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.reload();
  const duration = await page.locator('.world-card').first().evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(duration).toBe('0s');
});

test('corrupt saved progress is kept, a banner is shown, and the app still works', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nalanda.progress.v1', '{broken'));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('could not be read');
  await expect(page.getByRole('heading', { name: 'Choose a world' })).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('nalanda.progress.v1'));
  expect(stored).toBe('{broken');
});
