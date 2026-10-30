const { test, expect } = require("@playwright/test");

const BASE_URL = "https://rahulshettyacademy.com/client";
const PRODUCT_NAME = "ZARA COAT 3";
const COUNTRY_NAME = "India";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const testData = {
  email: requiredEnv("SANDBOX_EMAIL"),
  password: requiredEnv("SANDBOX_PASSWORD"),
  cardNumber: requiredEnv("SANDBOX_CARD_NUMBER"),
  cvv: requiredEnv("SANDBOX_CARD_CVV"),
  cardholder: requiredEnv("SANDBOX_CARDHOLDER"),
  expiryMonth: requiredEnv("SANDBOX_CARD_EXPIRY_MONTH"),
  expiryYear: requiredEnv("SANDBOX_CARD_EXPIRY_YEAR"),
  coupon: requiredEnv("SANDBOX_COUPON"),
};

function checkoutField(page, label) {
  return page.locator("div.field").filter({ hasText: label }).locator("input");
}

test("customer can complete a purchase and view matching order details", async ({ page }) => {
  await page.goto(BASE_URL);
  await page.getByPlaceholder("email@example.com").fill(testData.email);
  await page.getByPlaceholder("enter your passsword").fill(testData.password);
  await page.getByRole("button", { name: "Login" }).click();

  const productCard = page.locator(".card-body").filter({ hasText: PRODUCT_NAME });
  await expect(productCard).toBeVisible();
  await productCard.getByRole("button", { name: "Add To Cart" }).click();

  await page.locator("[routerlink='/dashboard/cart']").click();
  await expect(page.getByText(PRODUCT_NAME, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Checkout" }).click();

  const cardNumberField = checkoutField(page, "Credit Card Number");
  await expect(cardNumberField).toBeVisible();
  await cardNumberField.fill(testData.cardNumber);
  await checkoutField(page, "CVV Code").fill(testData.cvv);
  await checkoutField(page, "Name on Card").fill(testData.cardholder);
  await page.locator("select.input.ddl").nth(0).selectOption({ label: testData.expiryMonth });
  await page.locator("select.input.ddl").nth(1).selectOption({ label: testData.expiryYear });
  await expect(cardNumberField).toHaveValue(/^\d{4}(?: ?\d{4}){3}$/);

  await page.locator("input[name='coupon']").fill(testData.coupon);
  await page.getByRole("button", { name: "Apply Coupon" }).click();
  await expect(page.getByText("* Coupon Applied")).toBeVisible();

  await page.getByPlaceholder("Select Country").fill("ind");
  await page.locator(".ta-results").getByText(COUNTRY_NAME, { exact: true }).click();
  await expect(page.locator(".user__name input[type='text']")).toHaveValue(testData.email);

  await page.locator(".action__submit").click();
  await expect(page.getByText("Thankyou for the order.")).toBeVisible();

  const confirmationText = await page.locator("label.ng-star-inserted").first().innerText();
  const orderId = confirmationText.match(/[a-f0-9]{24}/i)?.[0];
  expect(orderId, "Order confirmation should include a 24-character order ID").toBeTruthy();

  await page.locator("button[routerlink='/dashboard/myorders']").click();
  const orderRow = page.locator("tbody tr").filter({ hasText: orderId });
  await expect(orderRow).toHaveCount(1);
  await orderRow.getByRole("button", { name: "View" }).click();
  await expect(page.getByText("Thank you for Shopping With Us")).toBeVisible();
  await expect(page.locator(".col-text").first()).toHaveText(orderId);
});
