const { test, expect } = require("@playwright/test");

test("HTTP GET request returns a post", async ({ request }) => {
  const response = await request.get("https://jsonplaceholder.typicode.com/posts/1");

  expect(response.status()).toBe(200);
  expect(response.ok()).toBeTruthy();

  const post = await response.json();
  expect(post).toMatchObject({
    userId: 1,
    id: 1,
  });
});