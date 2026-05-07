import { test, expect } from '@playwright/test';

// Simulates a user logging in
test('login flow works', async ({ page }) => {
  page.on('console', msg => console.log(msg.text()));
  // Go to login page
  await page.goto('/login');

  // Fill email input (selector depends on your actual HTML)
  await page.fill('input[type="email"]', 'pg@gmail.com');

  // Fill password input
  await page.fill('input[type="password"]', 'praisetobby');

  // Click submit button
  await page.click('button');
  //await page.click('button[type="submit"]');

  // Check user is redirected to dashboard
  await expect(page).toHaveURL('/', { timeout: 10000 });
});