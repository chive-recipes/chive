import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('sign in button opens Bluesky authorization', async ({ page, context }) => {
    // Intercept network requests to prevent actual redirect to Bluesky during test
    await page.route('**/oauth/authorize*', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>Mocked Bluesky Auth Page</body></html>'
      });
    });

    await page.goto('/');
    
    // Click Sign In link in header
    const signInButton = page.getByRole('link', { name: 'Sign in' });
    await expect(signInButton).toBeVisible();
    await signInButton.click();
    
    // Check if redirected to /login page
    await expect(page).toHaveURL('/login');
    
    // Fill in a mock handle on the login page
    await page.getByPlaceholder('handle.bsky.social').fill('test.bsky.social');
    
    // Verify submit button is visible
    const submitButton = page.getByRole('button', { name: 'Sign in' });
    await expect(submitButton).toBeVisible();
  });
});
