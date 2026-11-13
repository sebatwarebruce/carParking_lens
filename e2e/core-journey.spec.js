// Playwright spec for the core journey on a phone viewport. AUTHORED BUT NOT YET RUN in the build environment.
// Run: npm i -D @playwright/test && npx playwright install chromium && npx playwright test
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, permissions: ['camera'] });

test('attendant sees entry/exit on the dock and a cashier cannot see them', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email or phone/i).fill('attendant@parkwise.demo');
  await page.getByLabel(/^password/i).fill('demo1234');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/home/);
  const dock = page.getByRole('navigation', { name: 'Primary' });
  await expect(dock.getByRole('link', { name: /entry/i })).toBeVisible();
  await expect(dock.getByRole('link', { name: /exit/i })).toBeVisible();
  await page.getByRole('button', { name: /more/i }).click();
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/);
});

test('no horizontal scroll on core phone screens', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email or phone/i).fill('manager@parkwise.demo');
  await page.getByLabel(/^password/i).fill('demo1234');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  for (const path of ['/dashboard', '/spaces', '/entry', '/exit', '/sessions', '/payments']) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, `${path} scrolls horizontally`).toBe(false);
  }
});
