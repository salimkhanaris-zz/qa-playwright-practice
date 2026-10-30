const { test, expect } = require("@playwright/test");

test('Rahul Shetty Academy Login and Verify iPhone X Product', async ({ page }) => {
    await page.goto("https://rahulshettyacademy.com/loginpagePractise");
    
    await page.locator('input[name="username"]').fill("rahulshettyacademy");
    await page.locator('input[name="password"]').fill("Learning@830$3mK2");
    await page.locator('input[name="terms"]').check();
    await page.locator('#signInBtn').click();
    
    await page.waitForURL('**/angularpractice/shop**');
    
    const iPhoneXProduct = page.locator('h4:has-text("iphone X")');
    await expect(iPhoneXProduct).toBeVisible();
});