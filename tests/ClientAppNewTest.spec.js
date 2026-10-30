const { test, expect } = require("@playwright/test");

const BASE_URL = "https://rahulshettyacademy.com/client";
const TEST_USER = { email: "salim@salim.com", password: "Salimkhan@3" };
const TEST_PRODUCT = "ZARA COAT 3";
const TEST_COUNTRY = "India";

async function login(page) {
  await page.goto(BASE_URL);
  await page.getByPlaceholder("email@example.com").fill(TEST_USER.email);
  await page.getByPlaceholder("enter your passsword").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.locator(".card-body").first().waitFor();
}

test.describe("Client App", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Client App Login - verifies products load", async ({ page }) => {
    const productNames = await page.locator(".card-body b").allTextContents();
    expect(productNames.length).toBeGreaterThan(0);
    console.log("Products loaded:", productNames);
  });

  test("Client End to End - purchase flow", async ({ page }) => {
    await page.locator(".card-body")
      .filter({ hasText: TEST_PRODUCT })
      .getByRole("button", { name: "Add To Cart" })
      .click();

    await page.locator("[routerlink='/dashboard/cart']").click();
    await page.locator("div li").first().waitFor();
    await expect(page.getByText(TEST_PRODUCT)).toBeVisible();

    await page.getByRole("button", { name: "Checkout" }).click();

    await page.locator("input.input.txt.text-validated").first().fill("4542993192922293");
    await page.locator("select.input.ddl").nth(0).selectOption({ label: "03" });
    await page.locator("select.input.ddl").nth(1).selectOption({ label: "31" });
    await page.locator("input.input.txt").nth(0).fill("123");
    await page.locator("input.input.txt").nth(1).fill("Salim");
    await page.locator("input.input.txt").nth(2).fill("Khan");
    await page.locator("input.input.txt").nth(3).fill("rahulshettyacademy");

    await page.getByRole("button", { name: "Apply Coupon" }).click();
    await expect(page.getByText("* Coupon Applied")).toBeVisible();

    await page.getByPlaceholder("Select Country").pressSequentially("ind", { delay: 100 });
    await page.getByRole("option", { name: TEST_COUNTRY }).click();

    await expect(page.locator(".user__name [type*='text']").first()).toHaveValue(TEST_USER.email);
    await page.locator(".action__submit").click();

    await expect(page.getByText("Thankyou for the order.")).toBeVisible();

    const orderIdText = await page.locator("label.ng-star-inserted").textContent();
    const orderId = orderIdText?.split(" ").pop()?.trim();
    console.log("Order ID:", orderId);

    await page.locator("button[routerlink='/dashboard/myorders']").click();
    await page.locator("tbody").waitFor();

    const rows = page.locator("tbody tr");
    for (let i = 0; i < await rows.count(); i++) {
      const rowOrderId = await rows.nth(i).locator("th").textContent();
      if (rowOrderId?.includes(orderId ?? "")) {
        await rows.nth(i).locator("button.btn.btn-primary").click();
        break;
      }
    }

    await page.waitForLoadState("networkidle");
    const orderDetailsId = await page.locator(".col-text").textContent();
    expect(orderDetailsId?.trim()).toBe(orderId);
  });
});