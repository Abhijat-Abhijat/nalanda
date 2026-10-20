import { test, expect } from '@playwright/test';
test.describe.configure({ timeout: 240_000 });

test('a Java endless loop times out and the next run works', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'Java', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Java editor' });
  const run = page.getByRole('button', { name: 'Run' });
  await editor.fill('public class Main { public static void main(String[] a) { while (true) {} } }');
  await expect(run).toBeEnabled({ timeout: 120_000 });
  await run.click();
  await expect(page.getByText('Stopped after 5 s. Check for an endless loop.')).toBeVisible({ timeout: 120_000 });
  await editor.fill('public class Main { public static void main(String[] a) { System.out.println(6 * 7); } }');
  await expect(run).toBeEnabled({ timeout: 120_000 });
  await run.click();
  await expect(page.locator('pre.stdout')).toHaveText('42', { timeout: 120_000 });
});

test('playground compiles and runs C++', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'C++' }).click();
  await page.getByRole('textbox', { name: 'C++ editor' }).fill('#include <iostream>\nint main() { std::cout << 6 * 7 << std::endl; }');
  const run = page.getByRole('button', { name: 'Run' });
  await expect(run).toBeEnabled({ timeout: 120_000 });
  await run.click();
  await expect(page.locator('pre.stdout')).toHaveText('42', { timeout: 120_000 });
});

test('playground runs Java', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'Java', exact: true }).click();
  await page.getByRole('textbox', { name: 'Java editor' }).fill('public class Main { public static void main(String[] a) { System.out.println(6 * 7); } }');
  const run = page.getByRole('button', { name: 'Run' });
  await expect(run).toBeEnabled({ timeout: 120_000 });
  await run.click();
  await expect(page.locator('pre.stdout')).toHaveText('42', { timeout: 120_000 });
});

test('a C++ endless loop times out and the next run works', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'C++' }).click();
  const editor = page.getByRole('textbox', { name: 'C++ editor' });
  const run = page.getByRole('button', { name: 'Run' });
  await editor.fill('int main() { volatile int x = 0; while (true) { x++; } }');
  await expect(run).toBeEnabled({ timeout: 120_000 });
  await run.click();
  await expect(page.getByText('Stopped after 5 s. Check for an endless loop.')).toBeVisible({ timeout: 60_000 });
  await editor.fill('#include <iostream>\nint main() { std::cout << "again" << std::endl; }');
  await expect(run).toBeEnabled({ timeout: 120_000 });
  await run.click();
  await expect(page.locator('pre.stdout')).toHaveText('again', { timeout: 120_000 });
});

const EXERCISE_CODE = [
  ['C++', 'C++ editor', 'class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) { unordered_set<int> s; for (int n : nums) { if (s.count(n)) return true; s.insert(n); } return false; }\n};'],
  ['Java', 'Java editor', 'class Solution {\n    public boolean containsDuplicate(int[] nums) { Set<Integer> s = new HashSet<>(); for (int n : nums) if (!s.add(n)) return true; return false; }\n}'],
] as const;

for (const [lang, label, code] of EXERCISE_CODE) {
  test(`an algorithms exercise passes in ${lang}`, async ({ page }) => {
    await page.goto('/#/w/algorithms/al-arrays/l1');
    await page.getByRole('tab', { name: lang, exact: true }).click();
    await page.getByRole('textbox', { name: label }).fill(code);
    const check = page.locator('.js-runner').getByRole('button', { name: 'Check answer' });
    await expect(check).toBeEnabled({ timeout: 120_000 });
    await check.click();
    await expect(page.getByText('All cases passed.')).toBeVisible({ timeout: 120_000 });
  });
}

async function runJava(page: import('@playwright/test').Page, code: string) {
  await page.getByRole('textbox', { name: 'Java editor' }).fill(code);
  const run = page.getByRole('button', { name: 'Run' });
  await expect(run).toBeEnabled({ timeout: 120_000 });
  await run.click();
  await expect(run).toBeEnabled({ timeout: 120_000 });
}

test('Java keeps non-ASCII text intact', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'Java', exact: true }).click();
  await runJava(page, 'public class Main { public static void main(String[] a) { System.out.println("é😀 " + "naïve".length()); } }');
  await expect(page.locator('pre.stdout')).toHaveText('é😀 5', { timeout: 120_000 });
});

test('the Java loop guard does not carry its timer into the next run', async ({ page }) => {
  await page.goto('/#/playground');
  await page.getByRole('tab', { name: 'Java', exact: true }).click();
  const loop = (label: string) => `public class Main { public static void main(String[] a) { long s = 0; for (int i = 0; i < 200000; i++) s += i; System.out.println("${label} " + s); } }`;
  await runJava(page, loop('first'));
  await expect(page.locator('pre.stdout')).toHaveText('first 19999900000', { timeout: 120_000 });
  await page.waitForTimeout(5_000);
  await runJava(page, loop('second'));
  await expect(page.locator('pre.stdout')).toHaveText('second 19999900000', { timeout: 120_000 });
});
