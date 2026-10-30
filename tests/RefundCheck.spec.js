const { test, expect } = require("@playwright/test");

const BASE_URL = "https://eventhub.rahulshettyacademy.com";
const email = "salim@salim.com";
const password = "Salimkhan@3";

test("Single ticket booking is eligible for refund", async ({ page }) => {
  // Step 1 - Login
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("link", { name: "Browse Events →" })).toBeVisible();

  // Step 2 - Book first event with 1 ticket (default)
  await page.goto(`${BASE_URL}/events`);
  const firstCard = page.getByTestId("event-card").first();
  await firstCard.waitFor();
  await firstCard.getByTestId("book-now-btn").click();
  await expect(page.locator("#ticket-count")).toContainText("1");
  await page.getByRole("textbox", { name: "Full Name*" }).fill("Salim Khan");
  await page.getByTestId("customer-email").fill(email);
  await page.getByRole("textbox", { name: "Phone Number*" }).fill("9716156888");
  await page.locator(".confirm-booking-btn").click();
  await expect(page.getByText(/Booking Confirmed!/)).toBeVisible();
  const bookedRef = (await page.locator(".booking-ref.font-mono").first().textContent()).trim();

  // Step 3 - Navigate to booking detail
  await page.getByRole("link", { name: "View My Bookings" }).click();
  await expect(page).toHaveURL(/\/bookings$/);
  await page.getByTestId("booking-card").filter({ hasText: bookedRef })
    .getByRole("link", { name: "View Details" }).first().click();
  await expect(page.getByText("Booking Information")).toBeVisible();

  // Step 4 - Validate booking ref
  await expect(page.getByText(bookedRef).first()).toBeVisible();
  const eventTitle = (await page.locator("h1").first().textContent()).trim();
  expect(
    bookedRef.charAt(0).toLowerCase(),
    `Booking ref "${bookedRef}" vs event title "${eventTitle}"`
  ).toBe(eventTitle.charAt(0).toLowerCase());

  // Step 5 - Check refund eligibility
  await page.getByRole("button", { name: "Check eligibility for refund?" }).click();
  await expect(page.locator("#refund-spinner")).toBeVisible({ timeout: 1000 });
  await expect(page.locator("#refund-spinner")).toBeHidden({ timeout: 6000 });

  // Step 6 - Validate result
  const result = page.locator("#refund-result");
  await expect(result).toBeVisible();
  await expect(result).toContainText("Eligible for refund");
  await expect(result).toContainText("Single-ticket bookings qualify for a full refund");
});

test("Group ticket booking is NOT eligible for refund", async ({ page }) => {
  // Step 1 - Login
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("link", { name: "Browse Events →" })).toBeVisible();

  // Step 2 - Book first event with 3 tickets (click "+" twice)
  await page.goto(`${BASE_URL}/events`);
  const firstCard = page.getByTestId("event-card").first();
  await firstCard.waitFor();
  await firstCard.getByTestId("book-now-btn").click();
  await page.locator('button:has-text("+")').click();
  await page.locator('button:has-text("+")').click();
  await expect(page.locator("#ticket-count")).toContainText("3");
  await page.getByRole("textbox", { name: "Full Name*" }).fill("Salim Khan");
  await page.getByTestId("customer-email").fill(email);
  await page.getByRole("textbox", { name: "Phone Number*" }).fill("9716156888");
  await page.locator(".confirm-booking-btn").click();
  await expect(page.getByText(/Booking Confirmed!/)).toBeVisible();
  const bookedRef = (await page.locator(".booking-ref.font-mono").first().textContent()).trim();

  // Step 3 - Navigate to booking detail
  await page.getByRole("link", { name: "View My Bookings" }).click();
  await expect(page).toHaveURL(/\/bookings$/);
  await page.getByTestId("booking-card").filter({ hasText: bookedRef })
    .getByRole("link", { name: "View Details" }).first().click();
  await expect(page.getByText("Booking Information")).toBeVisible();

  // Step 4 - Validate booking ref
  await expect(page.getByText(bookedRef).first()).toBeVisible();
  const eventTitle = (await page.locator("h1").first().textContent()).trim();
  expect(
    bookedRef.charAt(0).toLowerCase(),
    `Booking ref "${bookedRef}" vs event title "${eventTitle}"`
  ).toBe(eventTitle.charAt(0).toLowerCase());

  // Step 5 - Check refund eligibility
  await page.getByRole("button", { name: "Check eligibility for refund?" }).click();
  await expect(page.locator("#refund-spinner")).toBeVisible({ timeout: 1000 });
  await expect(page.locator("#refund-spinner")).toBeHidden({ timeout: 6000 });

  // Step 6 - Validate result
  const result = page.locator("#refund-result");
  await expect(result).toBeVisible();
  await expect(result).toContainText("Not eligible for refund");
  await expect(result).toContainText("Group bookings (3 tickets) are non-refundable");
});