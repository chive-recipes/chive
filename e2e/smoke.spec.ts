import { test, expect } from '@playwright/test';

test.describe('Chive Smoke Tests', () => {
  test('homepage loads and displays Chive header', async ({ page }) => {
    await page.goto('/');
    
    // Expect the title to be correct
    await expect(page).toHaveTitle(/Chive/);
    
    // Expect the header logo to be visible
    const logo = page.getByRole('link', { name: 'Chive' }).first();
    await expect(logo).toBeVisible();
  });

  test('navigates to bookmarks page', async ({ page }) => {
    await page.goto('/');
    
    // Click the bookmarks link in header
    const bookmarksLink = page.getByRole('link', { name: 'Bookmarks' }).first();
    await bookmarksLink.click();
    
    // Check URL
    await expect(page).toHaveURL(/.*\/bookmarks/);
    
    // Expect empty state message since no bookmarks are saved locally
    await expect(page.getByText('No saved recipes yet')).toBeVisible();
  });
});
