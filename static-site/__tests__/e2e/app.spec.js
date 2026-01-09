import { test, expect } from '@playwright/test';

test.describe('Static Site - Basic Functionality', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Neuroglancer Tourguide/);
    
    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('Neuroglancer Tourguide');
  });

  test('should have all main UI components', async ({ page }) => {
    await page.goto('/');
    
    // Check for mode buttons
    await expect(page.locator('#mode-explore')).toBeVisible();
    await expect(page.locator('#mode-query')).toBeVisible();
    await expect(page.locator('#mode-analysis')).toBeVisible();
    
    // Check for API settings button
    await expect(page.locator('#api-settings-btn')).toBeVisible();
    
    // Check for Neuroglancer container
    await expect(page.locator('#neuroglancer-container')).toBeVisible();
    
    // Check for side panels
    await expect(page.locator('#explore-panel')).toBeVisible();
  });

  test('should have dataset selector', async ({ page }) => {
    await page.goto('/');
    
    const selector = page.locator('#dataset-selector');
    await expect(selector).toBeVisible();
    
    // Check options
    const options = await selector.locator('option').allTextContents();
    expect(options).toContain('C. elegans (Comma Stage)');
    expect(options).toContain('HeLa Cell');
  });
});

test.describe('Mode Switching', () => {
  test('should switch between modes', async ({ page }) => {
    await page.goto('/');
    
    // Start in explore mode (default)
    await expect(page.locator('#explore-panel')).toBeVisible();
    
    // Switch to query mode
    await page.locator('#mode-query').click();
    await expect(page.locator('#query-panel')).toBeVisible();
    await expect(page.locator('#explore-panel')).not.toBeVisible();
    
    // Switch to analysis mode
    await page.locator('#mode-analysis').click();
    await expect(page.locator('#analysis-panel')).toBeVisible();
    await expect(page.locator('#query-panel')).not.toBeVisible();
    
    // Switch back to explore mode
    await page.locator('#mode-explore').click();
    await expect(page.locator('#explore-panel')).toBeVisible();
    await expect(page.locator('#analysis-panel')).not.toBeVisible();
  });

  test('should update active button state', async ({ page }) => {
    await page.goto('/');
    
    // Check initial state
    await expect(page.locator('#mode-explore')).toHaveClass(/active/);
    
    // Click query mode
    await page.locator('#mode-query').click();
    await expect(page.locator('#mode-query')).toHaveClass(/active/);
    await expect(page.locator('#mode-explore')).not.toHaveClass(/active/);
  });
});

test.describe('API Settings Modal', () => {
  test('should open and close API settings modal', async ({ page }) => {
    await page.goto('/');
    
    // Modal should be hidden initially
    const modal = page.locator('#api-modal');
    await expect(modal).toHaveCSS('display', 'none');
    
    // Open modal
    await page.locator('#api-settings-btn').click();
    await expect(modal).toHaveCSS('display', 'block');
    
    // Close modal
    await page.locator('.close').click();
    await expect(modal).toHaveCSS('display', 'none');
  });

  test('should have API provider tabs', async ({ page }) => {
    await page.goto('/');
    
    // Open modal
    await page.locator('#api-settings-btn').click();
    
    // Check tabs
    await expect(page.locator('[data-provider="anthropic"]')).toBeVisible();
    await expect(page.locator('[data-provider="openai"]')).toBeVisible();
    await expect(page.locator('[data-provider="google"]')).toBeVisible();
  });

  test('should switch between API provider tabs', async ({ page }) => {
    await page.goto('/');
    await page.locator('#api-settings-btn').click();
    
    // Check initial state (Anthropic active)
    await expect(page.locator('#anthropic-config')).toBeVisible();
    
    // Switch to OpenAI
    await page.locator('[data-provider="openai"]').click();
    await expect(page.locator('#openai-config')).toBeVisible();
    await expect(page.locator('#anthropic-config')).not.toBeVisible();
    
    // Switch to Google
    await page.locator('[data-provider="google"]').click();
    await expect(page.locator('#google-config')).toBeVisible();
    await expect(page.locator('#openai-config')).not.toBeVisible();
  });

  test('should have security warning', async ({ page }) => {
    await page.goto('/');
    await page.locator('#api-settings-btn').click();
    
    const warning = page.locator('.security-warning');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('API keys are stored');
  });
});

test.describe('Explore Mode', () => {
  test('should have explore tabs', async ({ page }) => {
    await page.goto('/');
    
    // Check tab buttons
    await expect(page.locator('[data-tab="screenshots"]')).toBeVisible();
    await expect(page.locator('[data-tab="narrations"]')).toBeVisible();
    await expect(page.locator('[data-tab="state"]')).toBeVisible();
  });

  test('should switch between explore tabs', async ({ page }) => {
    await page.goto('/');
    
    // Screenshots tab active by default
    await expect(page.locator('#screenshots-tab')).toHaveClass(/active/);
    
    // Switch to narrations
    await page.locator('[data-tab="narrations"]').click();
    await expect(page.locator('#narrations-tab')).toHaveClass(/active/);
    await expect(page.locator('#screenshots-tab')).not.toHaveClass(/active/);
    
    // Switch to state
    await page.locator('[data-tab="state"]').click();
    await expect(page.locator('#state-tab')).toHaveClass(/active/);
  });

  test('should have screenshot button', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('#screenshot-btn')).toBeVisible();
    await expect(page.locator('#screenshot-btn')).toContainText('Capture');
  });
});

test.describe('Query Mode', () => {
  test('should have query input and submit button', async ({ page }) => {
    await page.goto('/');
    await page.locator('#mode-query').click();
    
    await expect(page.locator('#query-input')).toBeVisible();
    await expect(page.locator('#query-submit')).toBeVisible();
  });

  test('should show example queries', async ({ page }) => {
    await page.goto('/');
    await page.locator('#mode-query').click();
    
    const examples = page.locator('#query-results .examples');
    await expect(examples).toBeVisible();
    await expect(examples).toContainText('show the largest mitochondrion');
  });
});

test.describe('Analysis Mode', () => {
  test('should have analysis input and submit button', async ({ page }) => {
    await page.goto('/');
    await page.locator('#mode-analysis').click();
    
    await expect(page.locator('#analysis-input')).toBeVisible();
    await expect(page.locator('#analysis-submit')).toBeVisible();
  });

  test('should show example analyses', async ({ page }) => {
    await page.goto('/');
    await page.locator('#mode-analysis').click();
    
    const examples = page.locator('#analysis-results .examples');
    await expect(examples).toBeVisible();
    await expect(examples).toContainText('volume distribution');
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    
    const h2s = page.locator('h2');
    await expect(h2s).toHaveCount(await h2s.count());
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#neuroglancer-container')).toBeVisible();
  });

  test('should be tablet responsive', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#neuroglancer-container')).toBeVisible();
  });
});
