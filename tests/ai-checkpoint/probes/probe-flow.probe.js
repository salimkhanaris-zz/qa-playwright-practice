const { test } = require("@playwright/test");

const BASE_URL = "https://rahulshettyacademy.com/client";
const TEST_USER = { email: "salim@salim.com", password: "Salimkhan@3" };

test("probe full flow v2", async ({ page }) => {
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

  // FIX A: exact-text match scoped to the typeahead results
  const india = page.locator(".ta-results").getByText("India", { exact: true });
  console.log("india count:", await india.count());
  await india.click();
  console.log("=== country selected OK ===");

  console.log("=== .user__name children ===");
  console.log(JSON.stringify(await page.locator(".user__name").evaluate((e) =>
    Array.from(e.querySelectorAll("*")).map((c) => ({ tag: c.tagName, type: c.getAttribute("type"), text: c.textContent?.trim() }))
  )));

  // Does toHaveValue work on the original locator (a <label>)?
  try {
    await page.locator(".user__name [type*='text']").first().waitFor();
    console.log("original locator tag:", await page.locator(".user__name [type*='text']").first().evaluate((e) => e.tagName));
    await page.locator(".user__name [type*='text']").first().fill("salim@salim.com");
    console.log("fill on label: OK");
  } catch (e) {
    console.log("fill on label FAILED:", e.message.split("\n")[0]);
  }

  await page.locator(".action__submit").click();

  await page.getByText("Thankyou for the order.").waitFor();

  const labelText = await page.locator("label.ng-star-inserted").first().textContent();
  console.log("=== ORDER LABEL RAW ===", JSON.stringify(labelText));
  console.log("=== split-pop ===", JSON.stringify(labelText?.split(" ").pop()?.trim()));
  const regexMatch = labelText?.match(/(\d+)\s*$/);
  console.log("=== regex tail ===", JSON.stringify(regexMatch?.[1]));

  await page.locator("button[routerlink='/dashboard/myorders']").click();
  await page.locator("tbody").waitFor();

  const rows = page.locator("tbody tr");
  const n = await rows.count();
  console.log("=== ORDER ROWS COUNT ===", n);
  for (let i = 0; i < Math.min(n, 3); i++) {
    const th = await rows.nth(i).locator("th").textContent();
    const td = await rows.nth(i).locator("td").allTextContents();
    console.log(`ROW ${i} th=${JSON.stringify(th)} td=${JSON.stringify(td)}`);
  }

  await rows.first().locator("button.btn.btn-primary").click();
  await page.waitForTimeout(2500);

  console.log("=== .col-text ALL ===", JSON.stringify(await page.locator(".col-text").allTextContents()));
  console.log("=== .col-text first ===", JSON.stringify(await page.locator(".col-text").first().textContent()));
  console.log("=== DETAILS BODY ===", (await page.locator("body").innerText()).slice(0, 500));
});
