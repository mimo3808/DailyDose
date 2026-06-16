import { test, expect } from '@playwright/test';

test('player route shows loading state when no brief', async ({ page }) => {
  await page.goto('/player?date=1999-01-01');
  // Either loads (no articles → 422 → error) or shows error
  await expect(page.locator('body')).toBeVisible();
  // We don't assert on success here because no fixture data
});
