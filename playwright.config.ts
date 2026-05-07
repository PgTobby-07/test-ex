import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Where your test files live
  testDir: './tests',

  use: {
    // Base URL so you can just do page.goto('/')
    baseURL: 'http://localhost:3000',

    // Run tests without opening browser UI (set false if you want to see it)
    headless: true,
  },

  webServer: {
    // Command to start your frontend (React/Vite/Next/etc.)
    command: 'npm run dev',

    // URL Playwright waits for before running tests
    url: 'http://localhost:3000',

    // If server already running, don’t restart it
    reuseExistingServer: true,
  },
});