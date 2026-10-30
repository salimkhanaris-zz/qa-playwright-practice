const { test, expect } = require("@playwright/test");

const BASE_URL = "https://rahulshettyacademy.com/client";
const TEST_USER = { email: "salim@salim.com", password: "Salimkhan@3" };

test("probe assertions", async ({ page }) => {
  await page.goto(BASE_URL);
  await page.getByPlaceholder("email@example.com").fill(TEST_USER.email);
  await page.getByPlaceholder("enter your passsword").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.locator(".card-body").first().waitFor();

  await page.locator(".card-body").filter({ hasText: "ZARA COAT 3" })
    .getByRole("button", { name: "Add To Cart" }).click();
  await page.locator("[routerlink='/dashboard/cart']").click();
  await page.locator("div li").first().waitFor();
  await page.getByRole("button", { name: "Checkout" }).click();
  await page.locator("div li").first().waitFor();

  await page.getByRole("textbox").nth(0).fill("4542993192922293");
  await page.locator("select.input.ddl").nth(0).selectOption({ label: "03" });
  await page.locator("select.input.ddl").nth(1).selectOption({ label: "31" });
  await page.getByRole("textbox").nth(1).fill("123");
  await page.getByRole("textbox").nth(2).fill("Salim Khan");
  await page.getByRole("textbox").nth(3).fill("rahulshettyacademy");
  await page.getByRole("button", { name: "Apply Coupon" }).click();
  await page.getByText("* Coupon Applied").waitFor();
  await page.getByPlaceholder("Select Country").pressSequentially("ind", { delay: 100 });
  await page.locator(".ta-results").getByText("India", { exact: true }).click();
  await page.locator(".action__submit").click();
  await page.getByText("Thankyou for the order.").waitFor();

  // 1) Strict-mode check on the ORIGINAL selector (no .first())
  const nLabels = await page.locator("label.ng-star-inserted").count();
  console.log("=== label.ng-star-inserted count ===", nLabels);
  console.log("=== all label texts ===", JSON.stringify(await page.locator("label.ng-star-inserted").allTextContents()));
  try {
    const t = await page.locator("label.ng-star-inserted").textContent();
    console.log("ORIGINAL textContent() OK:", JSON.stringify(t));
    console.log("ORIGINAL split-pop ->", JSON.stringify(t?.split(" ").pop()?.trim()));
  } catch (e) {
    console.log("ORIGINAL textContent() THREW:", e.message.split("\n")[0]);
  }

  // 2) Corrected extraction
  const raw = await page.locator("label.ng-star-inserted").first().textContent();
  const orderId = raw?.replace(/[^a-zA-Z0-9]/g, "");
  console.log("=== CORRECTED orderId ===", JSON.stringify(orderId));

  // 3) Order row lookup by filter
  await page.locator("button[routerlink='/dashboard/myorders']").click();
  await page.locator("tbody").waitFor();
  const rows = page.locator("tbody tr");
  console.log("=== total rows ===", await rows.count());
  const matching = rows.filter({ hasText: orderId });
  console.log("=== rows matching orderId ===", await matching.count());
  const th = await matching.first().locator("th").textContent();
  console.log("=== matching th ===", JSON.stringify(th));

  // 4) Is the just-created order always row 0?
  console.log("=== row0 th ===", JSON.stringify(await rows.nth(0).locator("th").textContent()));

  // 5) Details page assertion
  await matching.first().getByRole("button", { name: "View" }).click();
  await expect(page.getByText("Thank you for Shopping With Us")).toBeVisible();
  const detailId = (await page.locator(".col-text").first().textContent())?.trim();
  console.log("=== details id ===", JSON.stringify(detailId), "=== equals orderId:", detailId === orderId);

  // 6) Cart page: what does the product row look like (for user-visible cart assertion)?
  await page.locator("button[routerlink='/dashboard/cart']").click();
  await expect(page.getByText("ZARA COAT 3")).toBeVisible();
  console.log("=== cart visible check OK ===");
});
