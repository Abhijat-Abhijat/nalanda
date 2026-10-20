import { test, expect } from '@playwright/test';

test('career hub reaches tools and data survives reload', async ({ page }) => {
  await page.goto('/#/career');
  await expect(page.getByRole('heading', { name: 'Career', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Career paths/ }).click();
  await page.getByRole('link', { name: /Backend engineer, senior level/ }).click();
  await page.getByRole('button', { name: 'Make this my path' }).click();
  await expect(page.getByText('This is your path.')).toBeVisible();
  await page.goto('/#/career/applications');
  await page.getByLabel('Company').fill('Atlassian');
  await page.getByRole('button', { name: 'Add application' }).click();
  await page.reload();
  await expect(page.getByText('Atlassian')).toBeVisible();
  await page.goto('/#/career/interview/behavioural-30/7');
  await expect(page.getByText(/Question 1 of 3/)).toBeVisible();
  await page.getByRole('button', { name: 'Finish round' }).click();
  await expect(page.getByRole('heading', { name: /Your score/ })).toBeVisible();
});

test('career pages fit a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/#/career', '/#/career/paths', '/#/career/interview', '/#/career/goals', '/#/career/match', '/#/career/applications']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect([path, overflow]).toEqual([path, false]);
  }
});
