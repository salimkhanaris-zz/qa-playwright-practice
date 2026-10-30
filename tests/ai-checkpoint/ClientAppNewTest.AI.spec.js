/**
 * ClientAppNewTest.AI.spec.js
 *
 * AI-assisted rewrite of tests/ClientAppNewTest.spec.js.
 * The original file is kept untouched as the measurement baseline.
 *
 * Every change is traceable to a verified defect - see
 * ../../AI-CHECKPOINT-CLIENTAPP.md for the evidence.
 */
const { test, expect } = require("@playwright/test");

const BASE_URL = "https://rahulshettyacademy.com/client";
const TEST_USER = { email: "salim@salim.com", password: "Salimkhan@3" };
const TEST_PRODUCT = "ZARA COAT 3";
const TEST_COUNTRY = "India";

const CARD = {
  number: "4542993192922293",
  cvv: "123",
  nameOnCard: "Salim Khan",
  expiryMonth: "03",
  expiryYear: "31",
};
const COUPON_CODE = "rahulshettyacademy";

/**
 * The checkout form renders each field as
 *   <div class="field"><div>Human Label</div><input ...></div>
 * Addressing fields by their visible label removes the positional
 * `.nth(n)` coupling that silently mis-mapped the card number.
 */
function fieldByLabel(page, label) {
  return page.locator("div.field", { hasText: label }).locator("input");
}

async function login(page) {
  await page.goto(BASE_URL);
  await page.getByPlaceholder("email@example.com").fill(TEST_USER.email);
  await page.getByPlaceholder("enter your passsword").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Login" }).click();
  // Signed-in state is proven by content, not by a sleep.
  await expect(page.locator(".card-body b").filter({ hasText: TEST_PRODUCT })).toBeVisible();
}

test.describe("Client App - AI-assisted purchase flow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("purchase flow - cart, checkout, confirmation and order details all agree", async ({
    page,
  }) => {
    // 1. The product is offered ------------------------------------------------
    const productCard = page.locator(".card-body").filter({ hasText: TEST_PRODUCT });
    await expect(productCard).toBeVisible();
    await productCard.getByRole("button", { name: "Add To Cart" }).click();

    // 2. The cart holds the product we picked ---------------------------------
    await page.locator("[routerlink='/dashboard/cart']").click();
    await expect(page.getByText(TEST_PRODUCT)).toBeVisible();
    await expect(page.getByText("IN STOCK")).toBeVisible();
    await expect(page.getByText("Total", { exact: true })).toBeVisible();

    // 3. Every checkout field receives the right value in the right field ------
    await page.getByRole("button", { name: "Checkout" }).click();
    await expect(fieldByLabel(page, "Credit Card Number")).toBeVisible();

    await fieldByLabel(page, "Credit Card Number").fill(CARD.number);
    await fieldByLabel(page, "CVV Code").fill(CARD.cvv);
    await fieldByLabel(page, "Name on Card").fill(CARD.nameOnCard);
    await page.locator("select.input.ddl").nth(0).selectOption({ label: CARD.expiryMonth });
    await page.locator("select.input.ddl").nth(1).selectOption({ label: CARD.expiryYear });

    // Regression guard: the card number used to be overwritten with "123"
    // because the field was addressed positionally.
    await expect(fieldByLabel(page, "Credit Card Number")).toHaveValue(/^\d{16}$/);
    await expect(fieldByLabel(page, "CVV Code")).toHaveValue(CARD.cvv);
    await expect(fieldByLabel(page, "Name on Card")).toHaveValue(CARD.nameOnCard);

    // 4. The coupon is accepted ------------------------------------------------
    await page.locator("input[name='coupon']").fill(COUPON_CODE);
    await page.getByRole("button", { name: "Apply Coupon" }).click();
    await expect(page.getByText("* Coupon Applied")).toBeVisible();

    // 5. The country is chosen from the suggestion list ------------------------
    await page.getByPlaceholder("Select Country").pressSequentially("ind", { delay: 100 });
    await page.locator(".ta-results").getByText(TEST_COUNTRY, { exact: true }).click();
    await expect(page.getByPlaceholder("Select Country")).toHaveValue(TEST_COUNTRY);

    // The shipping email INPUT, not the <label> that merely displays it.
    await expect(page.locator(".user__name input[type='text']")).toHaveValue(TEST_USER.email);

    // 6. The order is confirmed ------------------------------------------------
    await page.locator(".action__submit").click();
    await expect(page.getByText("Thankyou for the order.")).toBeVisible();
    await expect(
      page.getByText("You can see all the Orders in Orders History Page")
    ).toBeVisible();

    // The confirmation renders as " | <orderId> | " - strip the separators.
    const rawLabel = await page.locator("label.ng-star-inserted").first().textContent();
    const orderId = rawLabel?.replace(/[^a-zA-Z0-9]/g, "");
    expect(orderId).toMatch(/^[0-9a-f]{24}$/);

    // 7. The order is listed exactly once and its details match ---------------
    await page.locator("button[routerlink='/dashboard/myorders']").click();
    await expect(page.locator("tbody tr")).not.toHaveCount(0);

    // Regression guard: the order used to be matched with an empty string,
    // which silently selected the first row of the table.
    const orderRow = page.locator("tbody tr").filter({ hasText: orderId });
    await expect(orderRow).toHaveCount(1);

    await orderRow.getByRole("button", { name: "View" }).click();
    await expect(page.getByText("Thank you for Shopping With Us")).toBeVisible();
    await expect(page.locator(".col-text").first()).toHaveText(orderId);
    await expect(page.getByText(TEST_PRODUCT)).toBeVisible();

    // 8. Cleanup - keep the shared sandbox account repeatable ------------------
    await page.locator("button[routerlink='/dashboard/myorders']").click();
    await expect(page.locator("tbody tr")).not.toHaveCount(0);
    await orderRow.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator("tbody tr").filter({ hasText: orderId })).toHaveCount(0);
  });
});
