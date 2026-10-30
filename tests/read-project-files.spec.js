const { test } = require('@playwright/test');

test('read project files', async ({ page }) => {
  await page.goto('about:blank');
  const text = await page.evaluate(() => fetch('file:///c:/Users/Salim/Documents/Learning/Playwright/pages/LoginPage.js').then(r => r.text()));
  console.log('---LOGINPAGE---');
  console.log(text);
  const shoptext = await page.evaluate(() => fetch('file:///c:/Users/Salim/Documents/Learning/Playwright/pages/ShopPage.js').then(r => r.text()));
  console.log('---SHOPPAGE---');
  console.log(shoptext);
  const specText = await page.evaluate(() => fetch('file:///c:/Users/Salim/Documents/Learning/Playwright/tests/WebAPIPart1.spec.js').then(r => r.text()));
  console.log('---SPEC---');
  console.log(specText);
});
