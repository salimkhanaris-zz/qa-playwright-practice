const { test } = require("@playwright/test");

const BASE_URL = "https://rahulshettyacademy.com/client";
const TEST_USER = { email: "salim@salim.com", password: "Salimkhan@3" };

test("probe checkout DOM", async ({ page }) => {
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

  // Dump all inputs in DOM order with class / value / aria
  const inputs = await page.locator("input").evaluateAll((els) =>
    els.map((e, i) => ({
      i,
      tag: e.tagName,
      type: e.type,
      cls: e.className,
      placeholder: e.placeholder,
      value: e.value,
      id: e.id,
    }))
  );
  console.log("=== INPUTS ===");
  console.log(JSON.stringify(inputs, null, 2));

  const selects = await page.locator("select").evaluateAll((els) =>
    els.map((e, i) => ({
      i, tag: e.tagName, cls: e.className, value: e.value,
      options: Array.from(e.options).map((o) => o.text).slice(0, 5),
    }))
  );
  console.log("=== SELECTS ===");
  console.log(JSON.stringify(selects, null, 2));

  // Country typeahead
  await page.getByPlaceholder("Select Country").pressSequentially("ind", { delay: 100 });
  await page.waitForTimeout(1000);
  const sugg = await page.locator(".ta-results button").evaluateAll((els) =>
    els.map((e, i) => ({ i, tag: e.tagName, role: e.getAttribute("role"), text: e.textContent?.trim() }))
  );
  console.log("=== TYPEAHEAD .ta-results button ===");
  console.log(JSON.stringify(sugg, null, 2));

  const container = await page.locator(".ta-results").evaluate((e) => ({
    tag: e.tagName, role: e.getAttribute("role"), cls: e.className,
    html: e.outerHTML.slice(0, 600),
  }));
  console.log("=== .ta-results container ===");
  console.log(JSON.stringify(container, null, 2));

  // Order confirmation label
  const label = await page.locator("label.ng-star-inserted").first().textContent();
  console.log("=== ORDER LABEL ===", JSON.stringify(label));
});
