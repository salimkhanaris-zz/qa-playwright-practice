const { test, expect } = require("@playwright/test");

const BASE_URL = "https://rahulshettyacademy.com/client";
const TEST_USER = { email: "salim@salim.com", password: "Salimkhan@3" };

test("probe delete flow", async ({ page }) => {
  await page.goto(BASE_URL);
  await page.getByPlaceholder("email@example.com").fill(TEST_USER.email);
  await page.getByPlaceholder("enter your passsword").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.locator(".card-body").first().waitFor();

  await page.locator("button[routerlink='/dashboard/myorders']").click();
  await page.locator("tbody").waitFor();

  const rows = page.locator("tbody tr");
  const before = await rows.count();
  console.log("rows before:", before);

  const row = rows.first();
  const id = (await row.locator("th").textContent())?.trim();
  console.log("deleting row id:", id);

  const btn = row.getByRole("button", { name: "Delete" });
  console.log("delete button count:", await btn.count());
  console.log("delete button html:", await btn.first().evaluate((e) => e.outerHTML));

  await btn.first().click();
  await page.waitForTimeout(1500);

  console.log("=== AFTER DELETE CLICK ===");
  console.log((await page.locator("app-thanksorder, body").first().innerText()).slice(0, 900));
  console.log("modal/dialog count:", await page.locator(".modal, [role='dialog'], .ngb-modal").count());
  console.log("rows after:", await rows.count());
  console.log("still has id?", await page.locator("tbody tr").filter({ hasText: id }).count());
});
