import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 120_000 });

test('Ctrl+Enter checks a code exercise without inserting a newline', async ({ page }) => {
  await page.goto('/#/w/algorithms/al-arrays/l1');
  await page.getByRole('tab', { name: 'JavaScript' }).click();
  const editor = page.getByRole('textbox', { name: 'JavaScript editor' });
  const solution = 'function containsDuplicate(nums) { return new Set(nums).size !== nums.length; }';
  await editor.fill(solution);
  await expect(page.locator('.js-runner').getByRole('button', { name: 'Check answer' })).toBeEnabled({ timeout: 60_000 });
  await editor.press('Control+Enter');
  await expect(page.getByText('All cases passed.')).toBeVisible({ timeout: 30_000 });
  await expect(editor).toHaveText(solution);
});

test('Ctrl+Enter runs a SQL exercise query', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /^SQL/ }).click();
  await page.locator('a[href*="/w/sql/"]').first().click();
  const editor = page.getByRole('textbox', { name: 'SQL editor' });
  await editor.fill('SELECT 1 AS one');
  await editor.press('Control+Enter');
  await expect(page.getByRole('columnheader', { name: 'one' })).toBeVisible();
  await expect(editor).toHaveText('SELECT 1 AS one');
});
