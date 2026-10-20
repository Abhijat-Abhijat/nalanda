import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 120_000 });

test('playground runs Python print', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'Python' }).click();
  const editor = page.getByRole('textbox', { name: 'Python editor' });
  await editor.fill('print(sum(range(10)))');
  await expect(page.getByRole('button', { name: 'Run' })).toBeEnabled({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('pre.stdout')).toHaveText('45', { timeout: 30_000 });
});

test('playground runs a SQL query and shows a table', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'SQL' }).click();
  await page.getByRole('textbox', { name: 'SQL editor' }).fill('SELECT 1 AS one, 2 AS two;');
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.getByRole('columnheader', { name: 'two' })).toBeVisible();
});

test('keyboard shortcuts run code and toggle full screen', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'JavaScript' }).click();
  const editor = page.getByRole('textbox', { name: 'JavaScript editor' });
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled({ timeout: 60_000 });
  await editor.fill('console.log(6 * 7)');
  await editor.press('Control+Enter');
  await expect(page.locator('pre.stdout')).toHaveText('42');
  await expect(editor).toHaveText('console.log(6 * 7)');
  await editor.press('Control+Shift+F');
  await expect(page.getByRole('dialog', { name: 'Playground, full screen' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Full screen' }).click();
  await expect(page.getByRole('dialog', { name: 'Playground, full screen' })).toBeVisible();
});

test('python timeout then rerun works without a reload', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'Python' }).click();
  const editor = page.getByRole('textbox', { name: 'Python editor' });
  const run = page.getByRole('button', { name: 'Run' });
  await editor.fill('while True:\n    pass');
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(page.getByText('Stopped after 5 s. Check for an endless loop.')).toBeVisible({ timeout: 15_000 });
  await editor.fill('print("again")');
  await expect(run).toBeEnabled({ timeout: 60_000 });
  await run.click();
  await expect(page.locator('pre.stdout')).toHaveText('again', { timeout: 60_000 });
});

test('an algorithms exercise passes in Python', async ({ page }) => {
  await page.goto('/#/w/algorithms/al-arrays/l1');
  await page.getByRole('tab', { name: 'Python' }).click();
  await page.getByRole('textbox', { name: 'Python editor' }).fill('def containsDuplicate(nums):\n    return len(set(nums)) != len(nums)');
  const check = page.locator('.js-runner').getByRole('button', { name: 'Check answer' });
  await expect(check).toBeEnabled({ timeout: 60_000 });
  await check.click();
  await expect(page.getByText('All cases passed.')).toBeVisible({ timeout: 30_000 });
});
