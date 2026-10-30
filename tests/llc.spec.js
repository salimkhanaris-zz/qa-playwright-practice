const { test, expect } = require("@playwright/test");

const BASE_URL = "https://rahulshettyacademy.com/angularpractice/";

test.describe("Angular Practice Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("Submit form and verify success message", async ({ page }) => {
    await page.getByLabel("Check me out if you Love IceCreams!").check();
    await page.getByLabel("Employed").check();
    await page.getByLabel("Gender").selectOption("Female");
    await page.getByPlaceholder("Password").fill("salim1234");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText("The Form has been submitted successfully!")).toBeVisible();
  });

  test("Add Nokia Edge to cart and verify shop page", async ({ page }) => {
    await page.getByRole("link", { name: "Shop" }).click();
    await page.locator("app-card").filter({ hasText: "Nokia Edge" }).getByRole("button", { name: "Add" }).click();

    await expect(page.locator(".my-4").first()).toHaveText("Shop Name");
  });
});