const { test, expect, request } = require("@playwright/test");

const API_BASE = "https://jsonplaceholder.typicode.com";

test.describe("API Methods Demo", () => {
  let apiContext;

  test.beforeAll(async () => {
    apiContext = await request.newContext({ baseURL: API_BASE });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test("GET - Fetch a single post", async () => {
    const response = await apiContext.get("/posts/1");
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const post = await response.json();
    expect(post).toHaveProperty("id", 1);
    expect(post).toHaveProperty("title");
    expect(post).toHaveProperty("body");
    expect(post).toHaveProperty("userId");
  });

  test("GET - Fetch all posts", async () => {
    const response = await apiContext.get("/posts");
    expect(response.ok()).toBeTruthy();

    const posts = await response.json();
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts.length).toBeGreaterThan(0);
  });

  test("POST - Create a new post", async () => {
    const newPost = {
      title: "Playwright Test Post",
      body: "This is a test post created via Playwright API",
      userId: 1
    };

    const response = await apiContext.post("/posts", { data: newPost });
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201);

    const createdPost = await response.json();
    expect(createdPost).toHaveProperty("id");
    expect(createdPost.title).toBe(newPost.title);
    expect(createdPost.body).toBe(newPost.body);
    expect(createdPost.userId).toBe(newPost.userId);
  });

  test("PUT - Update an existing post", async () => {
    const updatedPost = {
      id: 1,
      title: "Updated Title via Playwright",
      body: "Updated body content",
      userId: 1
    };

    const response = await apiContext.put("/posts/1", { data: updatedPost });
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.title).toBe(updatedPost.title);
    expect(result.body).toBe(updatedPost.body);
    expect(result.id).toBe(1);
  });

  test("PATCH - Partial update a post", async () => {
    const partialUpdate = {
      title: "Partially Updated Title"
    };

    const response = await apiContext.patch("/posts/1", { data: partialUpdate });
    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.title).toBe(partialUpdate.title);
  });

  test("DELETE - Remove a post", async () => {
    const response = await apiContext.delete("/posts/1");
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });
});