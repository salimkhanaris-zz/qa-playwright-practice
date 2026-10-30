const { test, expect } = require("@playwright/test");

const BASE_URL = "https://rahulshettyacademy.com/client";
const TEST_USER = { email: "salim@salim.com", password: "Salimkhan@3" };

test("probe structure", async ({ page }) => {
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

  // Does toHaveValue work on a <label>?  (the original L53 assertion)
  const labelLoc = page.locator(".user__name label[type='text']");
  try {
    await expect(labelLoc.first()).toHaveValue(TEST_USER.email);
    console.log("toHaveValue on LABEL: PASSED (unexpected)");
  } catch (e) {
    console.log("toHaveValue on LABEL FAILED:", e.message.split("\n")[0]);
  }

  // Ancestor chain + attributes for each input
  const structure = await page.locator("input.input.txt").evaluateAll((els) =>
    els.map((e, i) => {
      const chain = [];
      let n = e;
      for (let d = 0; d < 5 && n; d++) {
        chain.push(`${n.tagName.toLowerCase()}${n.className ? "." + String(n.className).trim().split(/\s+/).join(".") : ""}`);
        n = n.parentElement;
      }
      return {
        i,
        value: e.value,
        placeholder: e.placeholder,
        ariaLabel: e.getAttribute("aria-label"),
        title: e.getAttribute("title"),
        name: e.getAttribute("name"),
        id: e.id,
        chain,
      };
    })
  );
  console.log("=== INPUT STRUCTURE ===");
  console.log(JSON.stringify(structure, null, 2));

  // Sibling label text for each input
  const siblingLabels = await page.locator("input.input.txt").evaluateAll((els) =>
    els.map((e, i) => {
      const parent = e.parentElement;
      const kids = parent ? Array.from(parent.children).map((c) => `${c.tagName}:${(c.textContent || "").trim().slice(0, 30)}`) : [];
      return { i, parentTag: parent?.tagName, kids };
    })
  );
  console.log("=== SIBLING CONTEXT ===");
  console.log(JSON.stringify(siblingLabels, null, 2));
});
