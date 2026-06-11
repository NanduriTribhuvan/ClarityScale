import { test, expect } from '@playwright/test';

const SECTION_IDS = ['home', 'services', 'how-it-works', 'pricing', 'testimonials', 'contact'];

test.describe('Home page', () => {
  test('renders every section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    for (const id of SECTION_IDS) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    // A single top-level heading (Requirement 11.4).
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('in-page navigation scrolls to the target section', async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav-link[href="#pricing"]').click();
    await expect(page.locator('#pricing')).toBeInViewport({ timeout: 5000 });
  });
});
