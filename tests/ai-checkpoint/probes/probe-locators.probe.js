const { test } = require("@playwright/test");

const BASE_URL = "https://rahulshettyacademy.com/client";
const TEST_USER = { email: "salim@salim.com", password: "Salimkhan@3" };

test("probe locators", async ({ page }) => {
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

  await page.getByPlaceholder("Select Country").pressSequentially("ind", { delay: 100 });
  await page.locator(".ta-results button").first().waitFor();

  // Raw DOM facts
  const facts = await page.locator(".ta-results button").evaluateAll((els) =>
    els.map((e) => ({
      textContent: e.textContent,
      innerText: e.innerText,
      outerHTML: e.outerHTML,
      ariaLabel: e.getAttribute("aria-label"),
    }))
  );
  console.log("=== RAW BUTTON FACTS ===");
  console.log(JSON.stringify(facts, null, 2));

  const cands = {
    "A .ta-results button (all)": page.locator(".ta-results button"),
    "B hasText 'India' substring": page.locator(".ta-results button", { hasText: "India" }),
    "C hasText /^India$/": page.locator(".ta-results button", { hasText: /^India$/ }),
    "D getByText exact India": page.getByText("India", { exact: true }),
    "E getByRole button name regex /India$/": page.getByRole("button", { name: /India$/ }),
    "F getByRole button name exact 'India'": page.getByRole("button", { name: "India", exact: true }),
    "G getByRole option 'India'": page.getByRole("option", { name: "India" }),
    "H .ta-results .ta-item hasText /^India$/": page.locator(".ta-results .ta-item", { hasText: /^India$/ }),
    "I getByText exact w/ ta-results": page.locator(".ta-results").getByText("India", { exact: true }),
    "J .ta-results button filter hasText 'India'": page.locator(".ta-results button").filter({ hasText: "India" }),
  };

  console.log("=== CANDIDATE COUNTS ===");
  for (const [k, loc] of Object.entries(cands)) {
    let count = -1;
    try {
      count = await loc.count();
    } catch (e) {
      count = "ERR " + e.message.split("\n")[0];
    }
    console.log(`${k} => ${count}`);
  }

  // Which one actually clicks India and not British Indian Ocean Territory?
  console.log("=== resolve B texts ===");
  const bTexts = await page.locator(".ta-results button", { hasText: "India" }).allTextContents();
  console.log(JSON.stringify(bTexts));

  console.log("=== resolve D texts ===");
  const dTexts = await page.getByText("India", { exact: true }).allTextContents();
  console.log(JSON.stringify(dTexts));

  console.log("=== resolve E texts ===");
  const eTexts = await page.getByRole("button", { name: /India$/ }).allTextContents();
  console.log(JSON.stringify(eTexts));
});
