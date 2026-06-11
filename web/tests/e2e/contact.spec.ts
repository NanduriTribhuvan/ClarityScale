import { test, expect } from '@playwright/test';

test.describe('Contact form', () => {
  test('shows a confirmation when the API succeeds', async ({ page }) => {
    // Stub the contact API so the test does not depend on email config.
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/');

    // The form hydrates on visibility — scroll it into view first.
    await page.locator('#contact-form').scrollIntoViewIfNeeded();

    await page.fill('#cf-name', 'Ada Lovelace');
    await page.fill('#cf-email', 'ada@example.com');
    await page.fill('#cf-message', 'I would like a new website for my startup.');

    await page.click('.contact-submit');

    await expect(page.locator('.form-status.success')).toBeVisible({ timeout: 5000 });
  });

  test('surfaces a field error when the API returns 400', async ({ page }) => {
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, errors: { email: 'Enter a valid email address.' } }),
      });
    });

    await page.goto('/');
    await page.locator('#contact-form').scrollIntoViewIfNeeded();

    await page.fill('#cf-name', 'Ada Lovelace');
    await page.fill('#cf-email', 'ada@example.com');
    await page.fill('#cf-message', 'Hello there, this is a test message.');
    await page.click('.contact-submit');

    await expect(page.locator('#cf-email-error')).toHaveText('Enter a valid email address.');
  });
});
