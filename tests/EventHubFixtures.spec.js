const { randomUUID } = require("node:crypto");
const { expect, test: base } = require("@playwright/test");

const BASE_URL = "https://eventhub.rahulshettyacademy.com";
const API_URL = "https://api.eventhub.rahulshettyacademy.com/api";
const USER = {
  email: "salim@salim.com",
  password: "Salimkhan@3",
};

const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder("you@email.com").fill(USER.email);
    await page.getByPlaceholder("••••••").fill(USER.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByTestId("user-email-display")).toContainText(USER.email);

    await use(page);
  },

  createEvent: async ({ request }, use) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: USER,
    });
    expect(loginResponse.ok()).toBeTruthy();
    const { token } = await loginResponse.json();
    expect(token).toBeTruthy();

    const suffix = randomUUID().slice(0, 8);
    const eventPayload = {
      title: `Playwright Fixture Event ${suffix}`,
      description: `Event created for Playwright fixture test ${suffix}`,
      category: "Conference",
      venue: `Fixture Venue ${suffix}`,
      city: "Hyderabad",
      eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      price: 750,
      totalSeats: 20,
    };
    const eventResponse = await request.post(`${API_URL}/events`, {
      headers: { Authorization: `Bearer ${token}` },
      data: eventPayload,
    });
    expect(eventResponse.ok()).toBeTruthy();
    const eventBody = await eventResponse.json();
    expect(eventBody.success).toBe(true);
    expect(eventBody.data.id).toBeTruthy();

    await use(eventBody.data);
  },
});

test("shows the event created by the fixture", async ({ authenticatedPage, createEvent }) => {
  await authenticatedPage.goto(`${BASE_URL}/events`);
  await expect(authenticatedPage.getByText(createEvent.title)).toBeVisible();
});
