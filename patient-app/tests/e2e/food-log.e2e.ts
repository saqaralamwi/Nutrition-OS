import { test, expect } from '@playwright/test';

test.describe('Food Log Page - E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/food-log');
  });

  test('should display the food log page title', async ({ page }) => {
    await expect(page.locator('h2')).toHaveText('سجل الطعام');
  });

  test('should show empty state when no food logged', async ({ page }) => {
    await expect(page.locator('text=لا يوجد طعام مسجل اليوم')).toBeVisible();
  });

  test('should search for food items', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="ابحث عن طعام..."]');
    await searchInput.fill('تفاح');
    await expect(page.locator('text=تفاح')).toBeVisible();
    await expect(page.locator('text=Apple')).toBeVisible();
  });

  test('should show calories info after searching', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="ابحث عن طعام..."]');
    await searchInput.fill('موز');
    await expect(page.locator('text=89 kcal/100g')).toBeVisible();
  });

  test('should select a food and show amount input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="ابحث عن طعام..."]');
    await searchInput.fill('دجاج');
    await page.locator('text=دجاج صدر').click();
    await expect(page.locator('text=الكمية:')).toBeVisible();
  });

  test('should save a food log', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="ابحث عن طعام..."]');
    await searchInput.fill('تفاح');
    await page.locator('text=تفاح').click();
    await page.locator('button:has-text("حفظ في السجل")').click();
    await page.waitForTimeout(500);
    const logEntries = page.locator('text=تفاح');
    await expect(logEntries.first()).toBeVisible();
  });

  test('should navigate between pages via navigation bar', async ({ page }) => {
    await page.locator('a[href="/glucose-log"]').click();
    await expect(page.locator('h2')).toHaveText('سكر الدم');
    await page.locator('a[href="/weight-log"]').click();
    await expect(page.locator('h2')).toHaveText('الوزن');
    await page.locator('a[href="/education"]').click();
    await expect(page.locator('h2')).toHaveText('المحتوى التعليمي');
  });

  test('should toggle language', async ({ page }) => {
    const toggleBtn = page.locator('button:has-text("English")');
    await toggleBtn.click();
    await expect(page.locator('text=Food Log')).toBeVisible();
  });

  test('should show macros per 100g', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="ابحث عن طعام..."]');
    await searchInput.fill('أرز بني');
    const card = page.locator('text=Brown Rice');
    await expect(card).toBeVisible();
  });

  test('should display navigation with all tabs', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav.locator('text=سجل الطعام')).toBeVisible();
    await expect(nav.locator('text=سكر الدم')).toBeVisible();
    await expect(nav.locator('text=الوزن')).toBeVisible();
    await expect(nav.locator('text=الأدوية')).toBeVisible();
    await expect(nav.locator('text=المواعيد')).toBeVisible();
    await expect(nav.locator('text=التعليم')).toBeVisible();
    await expect(nav.locator('text=الملف الشخصي')).toBeVisible();
  });
});
