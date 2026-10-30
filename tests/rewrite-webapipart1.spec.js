const fs = require('fs');

const target = 'c:\\Users\\Salim\\Documents\\Learning\\Playwright\\tests\\WebAPIPart1.spec.js';
const spec = `const { test, expect } = require('@playwright/test');

const { APIUtils } = require('../api/eventHubApi');
const { LoginPage } = require('../pages/LoginPage');
const { ShopPage } = require('../pages/ShopPage');

test.describe('API + UI Flow', () => {
  test('Login via API then complete purchase', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const productPage = new ShopPage(page);
    const api = new APIUtils(page, 'https://rahulshettyacademy.com/client');

    const loginPayload = { userEmail: 'salim@salim.com', userPassword: 'Salim@123' };
    const token = await api.getToken(loginPayload);

    await page.addInitScript((token) => {
      window.localStorage.setItem('token', token);
    }, token);

    await page.goto('https://rahulshettyacademy.com/client');
    await page.waitForLoadState('networkidle');

    await loginPage.login('salim@salim.com', 'Salim@123');
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();

    await productPage.addToCart('ZARA COAT 3');
    await page.locator('button:has-text("Cart")').click();
    await page.locator('button:has-text("Checkout")').click();

    const countryInput = page.locator('input[placeholder="Select Country"]');
    await countryInput.fill('ind');
    await page.locator('button').filter({ hasText: 'India' }).first().click();
    await page.locator('a:has-text("Place Order")').click();

    const orderId = await page.locator('.toast-container').textContent();
    expect(orderId).toContain('Order Placed Successfully');
  });

  test('API Login returns token', async ({ request }) => {
    const api = new APIUtils(request, 'https://rahulshettyacademy.com/client');
    const loginPayload = { userEmail: 'salim@salim.com', userPassword: 'Salim@123' };

    const response = await api.getToken(loginPayload);
    expect(response).toBeTruthy();
  });
});
`;

// This one-off script rewrites tests/WebAPIPart1.spec.js with a hard-coded copy of
// its (old) contents. Because it runs at module load, Playwright reverts that file as
// soon as the full suite is collected. Keep it opt-in so it can never undo real fixes.
if (process.env.RUN_REWRITE_SCRIPT === '1') {
  fs.writeFileSync(target, spec, 'utf8');
  console.log('Rewrote', target);
} else {
  console.log('Skipped rewrite of', target, '- set RUN_REWRITE_SCRIPT=1 to run it');
}
