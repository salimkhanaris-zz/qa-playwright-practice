const { expect, test } = require("@playwright/test");

const BASE_URL = "https://eventhub.rahulshettyacademy.com";
const API_URL = "https://api.eventhub.rahulshettyacademy.com/api";
const YAHOO_USER = {
  email: "yahoo.user.test@yahoo.com",
  password: "Test@12345",
};
const GMAIL_USER = {
  email: "gmail.user.test@gmail.com",
  password: "Test@12345",
};

async function ensureUserExists(request, user) {
  const registerRes = await request.post(`${API_URL}/auth/register`, {
    data: user,
  });

  if (registerRes.status() === 201) {
    return;
  }

  const errorBody = await registerRes.text();
  expect(
    registerRes.status(),
    `Registration failed for ${user.email}: ${errorBody}`
  ).toBe(400);
  expect(errorBody).toMatch(/already registered|already exists/i);
}

async function loginAs(page, user) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder("you@email.com").fill(user.email);
  await page.getByPlaceholder("••••••").fill(user.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByTestId("user-email-display")).toContainText(user.email);
}

test("a user cannot open another user's booking", async ({ page, request }) => {
  await ensureUserExists(request, YAHOO_USER);
  await ensureUserExists(request, GMAIL_USER);

  const loginRes = await request.post(`${API_URL}/auth/login`, {
    data: YAHOO_USER,
  });
  expect(loginRes.ok()).toBeTruthy();
  const loginBody = await loginRes.json();
  expect(loginBody.success).toBe(true);
  expect(loginBody.token).toBeTruthy();
  const token = loginBody.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const eventsRes = await request.get(`${API_URL}/events`, {
    headers: authHeaders,
  });
  expect(eventsRes.ok()).toBeTruthy();
  const eventsBody = await eventsRes.json();
  expect(eventsBody.data.length).toBeGreaterThan(0);
  const eventId = eventsBody.data[0].id;

  const bookingRes = await request.post(`${API_URL}/bookings`, {
    headers: authHeaders,
    data: {
      eventId,
      customerName: "Yahoo User",
      customerEmail: YAHOO_USER.email,
      customerPhone: "9876543210",
      quantity: 1,
    },
  });
  expect(bookingRes.ok()).toBeTruthy();
  const bookingBody = await bookingRes.json();
  expect(bookingBody.success).toBe(true);
  expect(bookingBody.data.id).toBeTruthy();
  const yahooBookingId = bookingBody.data.id;

  await loginAs(page, GMAIL_USER);
  await page.goto(`${BASE_URL}/bookings/${yahooBookingId}`, {
    waitUntil: "networkidle",
  });

  await expect(page.getByText("Access Denied")).toBeVisible();
  await expect(
    page.getByText("You are not authorized to view this booking")
  ).toBeVisible();
});
