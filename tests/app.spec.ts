import { test, expect } from '@playwright/test';

// Basic test to check if homepage loads
test('homepage loads', async ({ page }) => {
  // Opens baseURL ('http://localhost:3000')
  await page.goto('/');

  // Checks that the page has ANY title (sanity check)
  await expect(page).toHaveTitle(/./);
});