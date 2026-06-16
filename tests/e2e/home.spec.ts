import { test, expect } from '@playwright/test';

test('home renders topic chips and length slider', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DayilyDose' })).toBeVisible();
  // Wait for topics to load
  await expect(page.getByText('选择你关心的行业')).toBeVisible({ timeout: 10_000 });
  // At least one topic chip
  await expect(page.locator('button:has-text("(0)")').first()).toBeVisible();
  // Length slider
  await expect(page.getByText('简报时长（分钟）')).toBeVisible();
});
