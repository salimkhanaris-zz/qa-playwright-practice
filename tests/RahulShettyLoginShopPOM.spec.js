const { test, expect } = require("@playwright/test");
const { LoginPage } = require("../pages/LoginPage");
const { ShopPage } = require("../pages/ShopPage");

test("Rahul Shetty Academy login shows iphone X", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const shopPage = new ShopPage(page);

  await loginPage.open();
  await loginPage.login("rahulshettyacademy", "Learning@830$3mK2");

  await expect(shopPage.productByName("iphone X")).toBeVisible();
});