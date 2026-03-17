// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.js', '**/*.test.js', '**/test*.js'],

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // serial execution

  /* Timeout settings */
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  
  /* Reporter */
 reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  
  /* Shared settings */
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    /* Browser launch options */
    launchOptions: {
      slowMo: 600,
      args: [
        '--start-maximized',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    },
    
    /* Navigation settings */
    actionTimeout: 30000,
    navigationTimeout: 30000,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          slowMo: 500,
          args: ['--start-maximized']
        }
      },
    },
  ],
});