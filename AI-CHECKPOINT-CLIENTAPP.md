# AI-Assisted Testing Checkpoint — Client App Purchase Flow

> Worked example for the *"Apply AI to enhance existing testing practices and automation workflows"* checkpoint.
> Companion to [`AI-ASSISTED-TESTING.md`](./AI-ASSISTED-TESTING.md) (the brief). That file explains **what** the checkpoint wants;
> this file shows **how it was actually done**, with runnable code and measured numbers.
>
> Subject under test: [`tests/ClientAppNewTest.spec.js`](./tests/ClientAppNewTest.spec.js)
> Sandbox application: `https://rahulshettyacademy.com/client`

---

## 0. TL;DR — the measurable result

| Metric | Before (as-is) | After (AI-assisted) | Delta |
| --- | ---: | ---: | ---: |
| Runs | 10 | 10 | — |
| Runs completing the purchase flow | **0 / 10** | **10 / 10** | — |
| **Flow completion rate** | **0 %** | **100 %** | **+100 pp** |
| Failure rate | 100 % | 0 % | −100 pp |
| Assertions that can actually pass | 3 / 5 (60 %) | 20 / 20 (100 %) | **+40 pp** |
| Mean wall-clock per run | 22.7 s | 12.6 s | 44.4 % faster *(timeout removal — see §9.2)* |
| Real defects found by AI review | 0 (suite was red) | **4** | +4 |

The headline number for the mentor: **flow completion rate 0 % → 100 %**, plus **4 real defects uncovered that the original suite could never catch** because it never got past line 51.

A third configuration — the original with **only** the reported failure patched — is measured too, and it still completes the flow **0 / 10** times. That is the most instructive result in this document (§5.7, §9.2).

Read §11 before presenting this. There are honest caveats about sample size and the shared sandbox account.

---

## 1. What the checkpoint is actually asking for

### 1.1 The five hands-on activities, in plain language

| # | Activity | What it means in practice | Where this doc covers it |
| --- | --- | --- | --- |
| 1 | Build an AI-assisted automation solution | Use AI to help write/repair a test that drives a real user flow on the sandbox app. | §3 |
| 2 | Use AI for assertion generation | Ask AI what *should* be asserted for a given requirement, then reconcile that with what the app actually does. | §4 |
| 3 | Debug automation failures | When the suite goes red, use AI to triage the failure — app defect vs. stale locator vs. timing vs. test data. | §5 |
| 4 | Review automation scripts | Have AI review selectors, assertions, waits, and data isolation for correctness and reliability. | §6 |
| 5 | Optimize test suites | Remove waste (redundant waits, repeated logins, flaky patterns) without losing coverage. | §7 |

### 1.2 The exit checkpoint

> Demonstrate **one** measurable AI-assisted improvement (e.g. reduced flakiness, faster authoring) on the sandbox application to a mentor. It should be measurable, like in improved %.

This means: pick a metric, define the measurement protocol **before** you change anything, and report actual numbers — not a feeling. §9 is that protocol; §10 is the demo script.

### 1.3 The one rule that matters

**AI proposes; you verify.** Every suggestion in this document was checked against the running application before it was accepted. Several plausible-looking AI suggestions were **rejected** because the DOM said otherwise (§5.3, §5.7, §7.2). An unverified AI suggestion is just a different way to write a flaky test.

---

## 2. The system under test

### 2.1 The requirement being encoded

> A signed-in customer can add a product to the cart, check out with a card, apply a coupon, choose a shipping country, place the order, receive an order confirmation, and find **that same order** in their order history.

The last clause — *that same order* — is the interesting one. It is what makes this flow worth automating and what makes the test worth reviewing.

### 2.2 Annotated walkthrough of `ClientAppNewTest.spec.js`

| Lines | Block | Verdict after AI review |
| --- | --- | --- |
| 4 | Credentials hard-coded in source | ⚠️ Secret in VCS. Move to env vars. |
| 8–14 | `login()` helper | ⚠️ Ends on `.card-body` — a generic CSS class, not an outcome. |
| 21–25 | "products load" test | ⚠️ `toBeGreaterThan(0)` passes with a single element; does not check *which* product. |
| 28–31 | Add to cart | ✅ Good — filters the product card, then uses a role-based button. |
| 33–34 | Open cart, wait | ⚠️ `[routerlink='/dashboard/cart']` is an Angular implementation detail; `div li` matches almost anything. |
| 35 | Cart contains product | ✅ Good assertion. |
| 39–45 | Fill checkout fields | ❌ **Positional `.nth(n)` over a mixed-class selector — silently writes the wrong values.** See §5.5. |
| 47–48 | Apply coupon | ✅ Good assertion. |
| 50–51 | Select country | ❌ **Hard failure — wrong ARIA role.** See §5.2. |
| 53 | Shipping email check | ❌ **Hard failure — `toHaveValue` applied to a `<label>`.** See §5.4. |
| 54–56 | Place order + confirmation | ✅ Good assertion. |
| 58–59 | Extract order ID | ❌ **Returns an empty string.** See §5.6. |
| 62–72 | Find the order row | ❌ **Matches the *first* row unconditionally.** See §5.6. |
| 74–76 | Order details check | ❌ **Always fails** (compares a real ID to `""`), plus `networkidle`. See §5.6. |

### 2.3 Why this file is a good subject

It encodes a genuinely valuable end-to-end journey, it already has a clear structure, and it is **broken in ways that are invisible until you look**. Three of the four defects it contains are *silent*: the suite never fails because of them — it just quietly stops testing what it claims to test.

---

## 3. Activity 1 — Build the AI-assisted automation solution

### 3.1 Where the AI actually helped

The AI was used for four concrete things. All four produced artifacts you can re-run.

| AI task | Prompt shape | Artifact produced | Verified how |
| --- | --- | --- | --- |
| Understand the checkout DOM | *"Write a Playwright script that dumps every input on the checkout page with its classes, value, placeholder, accessible name and ancestor chain."* | `probes/probe-dom.probe.js`, `probes/probe-struct.probe.js` | Ran it; output is quoted throughout §5. |
| Rank candidate locators | *"Here is the DOM for a country autocomplete. Give me 10 candidate locators and predict which uniquely resolve."* | `probes/probe-locators.probe.js` | Ran it; every candidate was **counted**, predictions confirmed or refuted (§5.3). |
| Map checkout fields | *"Which input is the CVV and which is the card number? Use the visible label, not DOM order."* | `fieldByLabel()` helper | Ran it; value assertions now prove the mapping (§3.2, step 3). |
| Generate assertions | *"Given this requirement, list every user-visible outcome that should be asserted."* | Assertion table in §4.2 | Each assertion executed against the live app. |

The pattern: **AI generated candidates; the browser produced evidence; the evidence decided.** No suggestion was accepted on the AI's say-so alone.

### 3.2 The improved spec (the deliverable)

`tests/ai-checkpoint/ClientAppNewTest.AI.spec.js` — the original file is left untouched so it can serve as the measurement baseline.

```js
/**
 * The checkout form renders each field as
 *   <div class="field"><div>Human Label</div><input ...></div>
 * Addressing fields by their visible label removes the positional
 * `.nth(n)` coupling that silently mis-mapped the card number.
 */
function fieldByLabel(page, label) {
  return page.locator("div.field", { hasText: label }).locator("input");
}
```

The critical structural change: **fields are addressed by their visible label instead of their position.** That single change fixes a defect that produces a *green* test asserting the wrong thing (§5.5).

---

## 4. Activity 2 — AI for assertion generation

### 4.1 The prompt

> Review the Client App purchase flow against this requirement: *a customer purchases the selected product, receives confirmation, and can find the same order in order details.*
> For each outcome, tell me (a) which existing assertion proves it, (b) what is missing, and (c) what I should verify in the app before asserting it.
> Only suggest assertions on user-visible outcomes. Do not weaken anything to make the test pass.

### 4.2 Requirement → outcome → assertion table

| # | User-visible outcome | Existing assertion | Added by AI | Notes |
| --- | --- | --- | --- | --- |
| 1 | The signed-in user sees the product catalogue | `toBeGreaterThan(0)` (L23) | `.card-body b` filtered by product name is visible | Old check passes if *one* arbitrary product renders. |
| 2 | The product is in the cart | L35 ✅ | + `IN STOCK` visible, + `Total` visible | `Total` needs `exact: true` — `"Total"` is a substring of `"Subtotal"`. |
| 3 | Each checkout field holds the intended value | ❌ none | card number `/^\d{16}$/`, CVV, name-on-card | This is the assertion that catches the silent defect. |
| 4 | The coupon was accepted | L48 ✅ | (kept, plus coupon input addressed by `name="coupon"`) | The app exposes a stable `name="coupon"` hook. |
| 5 | The country was actually selected | ❌ none | country input `toHaveValue("India")` | Proves the click landed, not just that a click happened. |
| 6 | The shipping email is correct | L53 ❌ broken | `.user__name input[type='text']` `toHaveValue(email)` | Must target the *input*, not the label (§5.4). |
| 7 | The order was placed and confirmed | L56 ✅ | + "You can see all the Orders in Orders History Page" | Second, independent confirmation signal. |
| 8 | The order ID is a real ID | ❌ none | `expect(orderId).toMatch(/^[0-9a-f]{24}$/)` | Fails loudly if extraction breaks. |
| 9 | The order appears **exactly once** in history | ❌ none | `orderRow` `toHaveCount(1)` | Guards the empty-string match bug (§5.6). |
| 10 | Order details show the **same** order | L76 ❌ broken | `.col-text` `toHaveText(orderId)` | The real cross-check. |
| 11 | The order can be cleaned up | ❌ none | after delete, row count `0` | Repeatability on a shared account. |

### 4.3 What came out of it

The original purchase-flow test contained **5** `expect()` calls. **2 of them could never pass** (§5.4, §5.6). The AI-assisted version contains **20**, and **all 20 are executed and meaningful**.

> **Assertion effectiveness: 3/5 (60 %) → 20/20 (100 %) = +40 percentage points.**

That is a secondary metric. The primary one is §9.

---

## 5. Activity 3 — Debug automation failures

### 5.1 The triage model

Every failure is placed in exactly one bucket before a fix is proposed:

1. **Application defect** — the app is wrong.
2. **Stale / wrong locator or expectation** — the test is wrong about the UI.
3. **Timing / synchronization** — the test is racing.
4. **Test data / account / environment** — the world is different from the assumption.

The AI is explicitly instructed to *not* propose a weaker assertion as a workaround. The prompt used:

> Diagnose this Playwright failure. State which of the four buckets it belongs to, what evidence establishes that, and what remains uncertain. Give the smallest next check that would distinguish the remaining buckets.

### 5.2 Defect 1 — Country selection: wrong ARIA role *(hard failure)*

**Symptom**

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('option', { name: 'India' })
```

**Bucket: 2 — wrong locator.** The app's country suggestions are not ARIA options.

**Evidence.** From the captured page snapshot (`error-context.md`) and a direct DOM probe:

```html
<section class="ta-results list-group ng-star-inserted">
  <button type="button" class="ta-item list-group-item">
    <span><i class="fa fa-search"></i> British Indian Ocean Territory</span>
  </button>
  <button type="button" class="ta-item list-group-item">
    <span><i class="fa fa-search"></i> India</span>
  </button>
  ...
</section>
```

Three facts that a `getByRole("option", …)` locator cannot survive:

- The elements are `<button>`, so their implicit role is **`button`**, not `option`.
- The container is a plain `<section>` with **no `role="listbox"`**.
- The Font Awesome `<i>` contributes a **private-use glyph** to the *accessible name* — the computed name is `"<glyph>, India"`, not `"India"`.

### 5.3 The locator candidate matrix — where the "obvious" fix also fails

A naive fix is `getByRole("button", { name: "India" })`. It does not work either. Ten candidates were **counted against the live DOM** (`probes/probe-locators.probe.js`):

| # | Candidate locator | Matches | Verdict |
| --- | --- | ---: | --- |
| A | `.ta-results button` | 3 | ❌ too broad |
| B | `.ta-results button` + `hasText: "India"` | 2 | ❌ matches "British **Indian** Ocean Territory" |
| C | `.ta-results button` + `hasText: /^India$/` | 0 | ❌ regex is anchored against **untrimmed** text (`" India"`) |
| D | **`getByText("India", { exact: true })`** | **1** | ✅ **unique — adopted** |
| E | `getByRole("button", { name: /India$/ })` | 1 | ✅ works, but depends on the icon glyph's position |
| F | `getByRole("button", { name: "India", exact: true })` | 0 | ❌ accessible name is `"<glyph>, India"` |
| G | `getByRole("option", { name: "India" })` | 0 | ❌ **the original — role mismatch** |
| H | `.ta-results .ta-item` + `hasText: /^India$/` | 0 | ❌ same untrimmed-anchoring issue as C |
| I | `.ta-results` + `getByText("India", { exact: true })` | 1 | ✅ works and is scoped |
| J | `.ta-results button` `filter({ hasText: "India" })` | 2 | ❌ ambiguous |

**Adopted fix** — scoped, exact, and unambiguous:

```js
await page.getByPlaceholder("Select Country").pressSequentially("ind", { delay: 100 });
await page.locator(".ta-results").getByText(TEST_COUNTRY, { exact: true }).click();
await expect(page.getByPlaceholder("Select Country")).toHaveValue(TEST_COUNTRY);
```

> **This table is the single most valuable output of the activity.** The AI's *first* suggestion (F) would have looked correct and would have failed. Only measuring the candidates against the live DOM separated signal from noise.

### 5.4 Defect 2 — `toHaveValue` applied to a `<label>` *(hard failure, hidden behind Defect 1)*

**Evidence** (`probes/probe-struct.probe.js`):

```
original locator tag: LABEL
toHaveValue on LABEL FAILED: expect(locator).toHaveValue(expected) failed
```

```html
<div class="user__name mt-5">
  <label type="text">salim@salim.com</label>   <!-- displayed value -->
  <input type="text" value="salim@salim.com"> <!-- actual field  -->
</div>
```

`.user__name [type*='text']` matches **both**, because `[type*='text']` matches the `type` *attribute* and the `<label>` carries a bogus `type="text"`. `.first()` therefore resolves to the **label**, and `toHaveValue` requires an `<input>`/`<select>`/`<textarea>`.

**Fix — target the input:**

```js
await expect(page.locator(".user__name input[type='text']")).toHaveValue(TEST_USER.email);
```

### 5.5 Defect 3 — The credit-card number is silently overwritten with `"123"` *(silent defect — no failure at all)*

This is the defect that makes an AI review worth doing, because **nothing ever goes red**.

The original code addresses fields positionally:

```js
await page.locator("input.input.txt").nth(0).fill("123");   // CVV?
await page.locator("input.input.txt").nth(1).fill("Salim");
await page.locator("input.input.txt").nth(2).fill("Khan");
await page.locator("input.input.txt").nth(3).fill("rahulshettyacademy");
```

`input.input.txt` matches **six** inputs. The DOM probe produced this exact mapping:

| Index in `input.input.txt` | Visible label | Pre-filled value | Original test wrote | Correct target |
| ---: | --- | --- | --- | --- |
| 0 | **Credit Card Number** | `4542 9931 9292 2293` | **`"123"`** ⚠️ | CVV |
| 1 | CVV Code | — | `"Salim"` | Name on Card |
| 2 | Name on Card | — | `"Khan"` | Apply Coupon |
| 3 | Apply Coupon | — | `"rahulshettyacademy"` ✅ | (correct by luck) |
| 4 | Shipping email | `salim@salim.com` | — | — |
| 5 | Select Country | — | — | — |

Line 42 therefore **writes `"123"` into the credit-card number field**, replacing the 16-digit number with a 3-digit string. The test proceeds, the order is placed, and the test can still pass — because **no assertion ever checks the card number**.

The failure snapshot from the original run proves it:

```
- generic [ref=e54]:
  - generic [ref=e55]: Credit Card Number
  - textbox [ref=e56]: "123"          <-- corrupted
- generic [ref=e62]:
  - generic [ref=e63]: CVV Code ?
  - textbox [ref=e64]: "Salim"        <-- CVV holding a name
```

**Fix — address fields by their visible label, and assert the value:**

```js
await fieldByLabel(page, "Credit Card Number").fill(CARD.number);
await fieldByLabel(page, "CVV Code").fill(CARD.cvv);
await fieldByLabel(page, "Name on Card").fill(CARD.nameOnCard);

await expect(fieldByLabel(page, "Credit Card Number")).toHaveValue(/^\d{16}$/);
```

`/^\d{16}$/` is the regression guard: it passes for the real card number and fails for `"123"`.

### 5.6 Defect 4 — The order ID is extracted as an empty string *(silent match + guaranteed failure)*

```js
const orderIdText = await page.locator("label.ng-star-inserted").textContent();
const orderId = orderIdText?.split(" ").pop()?.trim();
```

The label actually renders as:

```
" | 6ad894b193b084c41f5e6947 | "
```

Split on spaces gives `["", "|", "6ad894b193b084c41f5e6947", "|", ""]`, so `.pop()` returns `""`. Measured directly:

```
=== ORIGINAL split-pop -> ""
```

Two consequences:

**(a) The order row is matched by the empty string.** `"6ad89…".includes("")` is `true` for *every* row, so the loop selects the **first row of the table, unconditionally**:

```js
if (rowOrderId?.includes(orderId ?? "")) {   // always true
```

The row lookup lands on the right row only because the sandbox happens to sort newest-first. That is luck, not correctness — a second session, a concurrent run, or a re-ordering breaks it.

**(b) The final assertion always fails:**

```js
expect(orderDetailsId?.trim()).toBe(orderId);   // "6ad89…" vs ""
```

**Fix — strip the separators, then match by content:**

```js
const rawLabel = await page.locator("label.ng-star-inserted").first().textContent();
const orderId = rawLabel?.replace(/[^a-zA-Z0-9]/g, "");
expect(orderId).toMatch(/^[0-9a-f]{24}$/);

const orderRow = page.locator("tbody tr").filter({ hasText: orderId });
await expect(orderRow).toHaveCount(1);          // exactly one row, not "the first row"
await orderRow.getByRole("button", { name: "View" }).click();
await expect(page.locator(".col-text").first()).toHaveText(orderId);
```

### 5.7 Why the "obvious" one-line patch was not enough

`tests/ai-checkpoint/ClientAppNewTest.ShallowFix.spec.js` is the original with **only** the country locator repaired — exactly what a naive AI patch produces. It is kept in the repo as evidence.

It still fails, one line further down, at line 53 of the original (line 58 of the shallow-fix copy, which carries two extra header lines):

```
Error: expect(locator).toHaveValue(expected) failed
Error: Not an input element
> 58 |     await expect(page.locator(".user__name [type*='text']").first()).toHaveValue(TEST_USER.email);
```

**Measured: 0 / 10 runs completed the flow** (§9.2, configuration B) — exactly the same completion rate as the untouched baseline, at 1.7× the wall-clock cost.

And if *that* is patched too, it fails at line 76 (empty order ID). **Three separate fixes are required** to make the flow green, and only the third one is a real improvement rather than damage control.

---

## 6. Activity 4 — Review the automation script

### 6.1 Review prompt

> Review this Playwright spec for correctness and reliability. Report: ambiguous or implementation-coupled selectors; assertions that do not prove a user-visible outcome; waits that do not correspond to a specific condition; repeated work that can be removed without losing coverage; and data that could make repeated runs interfere. For each finding give the line number, why it is a risk, and the smallest fix. Do not suggest removing meaningful checks.

### 6.2 Findings

| Severity | Line(s) | Finding | Resolution |
| --- | --- | --- | --- |
| 🔴 Blocker | 51 | `getByRole("option")` matches nothing — hard timeout | §5.3 — scoped `getByText` exact |
| 🔴 Blocker | 53 | `toHaveValue` on a `<label>` | §5.4 — target `input` |
| 🔴 Blocker | 59, 68, 76 | Order ID is `""` → wrong row, always-failing assert | §5.6 — strip separators, filter by content |
| 🟠 High | 42–45 | Positional `.nth(n)` writes `"123"` into the card number | §5.5 — label-addressed fields + value assertion |
| 🟠 High | 13, 34, 63 | `waitFor()` on `.card-body` / `div li` / `tbody` — meaningless waits | Replaced with web-first assertions on real outcomes |
| 🟡 Medium | 74 | `waitForLoadState("networkidle")` — discouraged; the project's own healer agent forbids it | Replaced with `expect(...)` on the details page |
| 🟡 Medium | 33, 62 | `[routerlink=…]` couples the test to Angular internals | Kept only where no user-visible role exists; documented |
| 🟡 Medium | 4 | Credentials in source control | Move to `process.env` — §6.3 |
| 🟢 Low | 23 | `toBeGreaterThan(0)` proves almost nothing | Replaced with the specific product |
| 🟢 Low | — | No cleanup — repeat runs pollute a shared account | Delete the created order (§3.2, step 8) |

### 6.3 Credentials

The original file hard-codes a real account (line 4). For the checkpoint that is acceptable in a local learning repo, but the rule to state out loud to a mentor is:

```js
const TEST_USER = {
  email: process.env.CLIENT_EMAIL,
  password: process.env.CLIENT_PASSWORD,
};
```

with the values in a git-ignored `.env`. Never paste credentials into AI prompts, docs, or screenshots. `AI-ASSISTED-TESTING.md` §"Do not copy account credentials…" says the same thing; this is where it bites.

---

## 7. Activity 5 — Optimize the test suite

### 7.1 Optimizations applied

| Optimization | Before | After | Effect |
| --- | --- | --- | --- |
| Replace meaningless waits with web-first assertions | 3 × `waitFor()` on generic selectors | 0 generic waits | Fewer arbitrary sync points; failures report the *assertion*, not a timeout |
| Remove `networkidle` | 1 use (line 74) | 0 | Directly contradicts this repo's own `playwright-test-healer` agent rule |
| Content-based order lookup | loop over all rows, break on first `includes("")` | 1 × `filter({ hasText: orderId })` | O(1) lookup, exact, and asserts uniqueness |
| Order cleanup | none | delete + assert gone | Shared account stays usable across repeated runs |
| Field addressing | 7 positional selectors on the checkout form | 1 label helper | Removes the class of defect in §5.5 entirely |

### 7.2 What was deliberately **not** optimized

| Tempting change | Why it was rejected |
| --- | --- |
| Replace `[routerlink='/dashboard/cart']` with `getByRole("link", { name: "Cart" })` | The nav control is a `<button>` whose accessible name includes the badge (`"Cart 1"`), so a role+name locator is *less* stable than the attribute selector. Verified, not assumed. |
| Mock the checkout API to make the test fast | That would remove the very behaviour under test. Out of scope for a UI-flow checkpoint. |
| Reuse a `storageState` login across tests | Tempting for speed, but it would change what the login test proves and add cache-expiry flakiness. Not worth the trade for 2 tests. |
| Assert the discount amount (`-$1150`) | The app never renders the discount as text on the checkout page — verified by dumping the page body. Asserting something that does not exist would create a permanently red test. |
| Convert `input.input.txt` → `getByRole("textbox").nth(k)` | Still positional. `fieldByLabel()` is strictly better. |
| Weaken the order-ID assertion to make it pass | The brief explicitly forbids this, and it would hide the §5.6 defect. |

---

## 8. Before / after

### 8.1 The four changed regions

```diff
-    await page.locator("input.input.txt.text-validated").first().fill("4542993192922293");
-    await page.locator("select.input.ddl").nth(0).selectOption({ label: "03" });
-    await page.locator("select.input.ddl").nth(1).selectOption({ label: "31" });
-    await page.locator("input.input.txt").nth(0).fill("123");
-    await page.locator("input.input.txt").nth(1).fill("Salim");
-    await page.locator("input.input.txt").nth(2).fill("Khan");
-    await page.locator("input.input.txt").nth(3).fill("rahulshettyacademy");
+    await fieldByLabel(page, "Credit Card Number").fill(CARD.number);
+    await fieldByLabel(page, "CVV Code").fill(CARD.cvv);
+    await fieldByLabel(page, "Name on Card").fill(CARD.nameOnCard);
+    await page.locator("select.input.ddl").nth(0).selectOption({ label: CARD.expiryMonth });
+    await page.locator("select.input.ddl").nth(1).selectOption({ label: CARD.expiryYear });
+    await expect(fieldByLabel(page, "Credit Card Number")).toHaveValue(/^\d{16}$/);
```

```diff
-    await page.getByPlaceholder("Select Country").pressSequentially("ind", { delay: 100 });
-    await page.getByRole("option", { name: TEST_COUNTRY }).click();
+    await page.getByPlaceholder("Select Country").pressSequentially("ind", { delay: 100 });
+    await page.locator(".ta-results").getByText(TEST_COUNTRY, { exact: true }).click();
+    await expect(page.getByPlaceholder("Select Country")).toHaveValue(TEST_COUNTRY);
```

```diff
-    await expect(page.locator(".user__name [type*='text']").first()).toHaveValue(TEST_USER.email);
+    await expect(page.locator(".user__name input[type='text']")).toHaveValue(TEST_USER.email);
```

```diff
-    const orderIdText = await page.locator("label.ng-star-inserted").textContent();
-    const orderId = orderIdText?.split(" ").pop()?.trim();
+    const rawLabel = await page.locator("label.ng-star-inserted").first().textContent();
+    const orderId = rawLabel?.replace(/[^a-zA-Z0-9]/g, "");
+    expect(orderId).toMatch(/^[0-9a-f]{24}$/);
```

```diff
-    const rows = page.locator("tbody tr");
-    for (let i = 0; i < await rows.count(); i++) {
-      const rowOrderId = await rows.nth(i).locator("th").textContent();
-      if (rowOrderId?.includes(orderId ?? "")) {
-        await rows.nth(i).locator("button.btn.btn-primary").click();
-        break;
-      }
-    }
-    await page.waitForLoadState("networkidle");
-    const orderDetailsId = await page.locator(".col-text").textContent();
-    expect(orderDetailsId?.trim()).toBe(orderId);
+    const orderRow = page.locator("tbody tr").filter({ hasText: orderId });
+    await expect(orderRow).toHaveCount(1);
+    await orderRow.getByRole("button", { name: "View" }).click();
+    await expect(page.getByText("Thank you for Shopping With Us")).toBeVisible();
+    await expect(page.locator(".col-text").first()).toHaveText(orderId);
```

### 8.2 Files

| File | Role |
| --- | --- |
| `tests/ClientAppNewTest.spec.js` | **Baseline** — untouched original |
| `tests/ai-checkpoint/ClientAppNewTest.AI.spec.js` | **After** — AI-assisted rewrite (the deliverable) |
| `tests/ai-checkpoint/ClientAppNewTest.ShallowFix.spec.js` | **Baseline B** — one-line patch, used to prove symptom-fixing is not enough |
| `tests/ai-checkpoint/probes/*.probe.js` | Evidence-gathering probes (§5) |
| `playwright.probe.config.js` | Separate config that runs the probes on demand |

> **Keeping CI clean.** The probes are named `*.probe.js`, which does not match Playwright's default `testMatch` (`**/*.@(spec|test).?(c|m)[jt]s?(x)`), so `npx playwright test` and the GitHub workflow never collect them. Run one explicitly with:
> ```powershell
> npx playwright test --config=playwright.probe.config.js probe-locators
> ```
> Two files under `tests/ai-checkpoint/` **are** collected (`ClientAppNewTest.AI.spec.js` — green and wanted; `ClientAppNewTest.ShallowFix.spec.js` — intentionally red). Exclude that folder from CI if you do not want the red one:
> ```js
> // playwright.config.js
> testIgnore: '**/ai-checkpoint/**',
> ```

---

## 9. Measurement

### 9.1 Protocol (defined before any change)

| Item | Value |
| --- | --- |
| Sandbox | `https://rahulshettyacademy.com/client` |
| Browser | Chromium, headless (`playwright.config.js`) |
| Workers | `1` — sequential, so runs cannot interfere |
| Repeats | `--repeat-each=10` |
| Environment | Same machine, same account, same network, same time window |
| Metric | **Flow completion rate** = runs that reach the final order-details assertion without error ÷ total runs |
| Secondary | Assertion effectiveness (§4.3), wall-clock per run, defects found |

```powershell
# Baseline
npx playwright test tests/ClientAppNewTest.spec.js --grep "purchase flow" --repeat-each=10 --workers=1 --reporter=line

# After
npx playwright test tests/ai-checkpoint/ClientAppNewTest.AI.spec.js --repeat-each=10 --workers=1 --reporter=line
```

### 9.2 Results

**Raw outcome** — all three configurations, same machine, same account, same window, `--workers=1`:

| Configuration | File | Runs | Completed the flow | Failed | Result line | Total elapsed | Mean / run |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
| **A — as-is (baseline)** | `tests/ClientAppNewTest.spec.js` | 10 | **0** | 10 | `10 failed` | 226.8 s | 22.7 s |
| **B — shallow fix** | `tests/ai-checkpoint/ClientAppNewTest.ShallowFix.spec.js` | 10 | **0** | 10 | `10 failed` | 130.6 s | 13.1 s |
| **C — AI-assisted (after)** | `tests/ai-checkpoint/ClientAppNewTest.AI.spec.js` | 10 | **10** | 0 | `10 passed` | 126.0 s | 12.6 s |

**Failure signature per configuration** — note how the failure *moves* but never disappears:

| Configuration | Fails at | Error |
| --- | --- | --- |
| A | `ClientAppNewTest.spec.js:51` | `TimeoutError: locator.click: Timeout 10000ms exceeded. — waiting for getByRole('option', { name: 'India' })` |
| B | `ClientAppNewTest.ShallowFix.spec.js:58` (= original L53) | `expect(locator).toHaveValue(expected) failed — Not an input element` |
| C | — | — |

**Headline metric**

| Metric | Before (A) | After (C) | Change |
| --- | ---: | ---: | ---: |
| **Purchase-flow completion rate** | **0 %** (0 / 10) | **100 %** (10 / 10) | **+100 pp** |
| Failure rate | 100 % | 0 % | −100 pp |
| Assertions that can actually pass | 3 / 5 (60 %) | 20 / 20 (100 %) | +40 pp |
| Mean wall-clock per run | 22.7 s | 12.6 s | 44.4 % faster *(see note)* |
| Real defects found | 0 | **4** | +4 |

**Reading the numbers honestly**

- **A → C is the headline: 0 % → 100 % flow completion.** The baseline was *deterministically red*, not flaky — it failed at the same line on all 10 runs. Say "the test was red", not "the test was flaky" (§11.1).
- **The 44.4 % speed-up is a side effect, not the goal.** Configuration A burns ~10 s per run waiting for the country locator to time out — that is the whole gap (22.7 s for A vs 13.1 s for B, which gets exactly one step further). Removing a timeout makes a run faster; it does not make a broken test valuable.
- **B is the most instructive row.** The obvious one-line AI patch moved the failure from line 51 to line 53 and left the completion rate at **0 %**. Nothing about B is an improvement in what the suite proves.
- **C is stable, not lucky.** 10 / 10 in a 12.6 s mean. The order is located **by ID** rather than by table position, so the growing order list on the shared account cannot shift the match, and each run deletes the order it created.
- **Why C is also marginally faster than B (12.6 s vs 13.1 s)** despite doing more work: B still executes the `networkidle` wait and the row-by-row scan that look for an order ID that is the empty string.

### 9.3 Formulas

```text
flow completion rate (%) = successful runs / total runs × 100
improvement (percentage points) = after rate − before rate
relative improvement (%) = (after rate − before rate) / before rate × 100
assertion effectiveness (%) = assertions that can pass / total assertions × 100
time saved (%) = (before seconds − after seconds) / before seconds × 100
```

### 9.4 Reproducing the numbers yourself

```powershell
npx playwright test tests/ClientAppNewTest.spec.js --grep "purchase flow" --repeat-each=10 --workers=1 --reporter=line
npx playwright test tests/ai-checkpoint/ClientAppNewTest.ShallowFix.spec.js --repeat-each=10 --workers=1 --reporter=line
npx playwright test tests/ai-checkpoint/ClientAppNewTest.AI.spec.js --repeat-each=10 --workers=1 --reporter=line
```

Raw logs: `tests/ai-checkpoint/measure-A.log`, `measure-B.log`, `measure-C.log`.

---

## 10. Mentor demo script (3–5 minutes)

1. **Requirement (20 s).** *"A signed-in customer buys a product and can find that same order in their order history."* Point at `ClientAppNewTest.spec.js`.
2. **Baseline (30 s).** Run the original once — it fails at line 51 after a 10 s timeout. Show the error: `waiting for getByRole('option', { name: 'India' })`.
3. **The AI prompt (30 s).** Show the prompt from §5.1 and the four defects it surfaced. Emphasise that **three of the four were invisible** — the suite never reported them.
4. **The evidence (60 s).** Show the locator matrix (§5.3) and note that the AI's *first* suggestion (`getByRole("button", { name: "India", exact: true })`) was **wrong** — it matches 0 elements because the Font Awesome glyph pollutes the accessible name. Then show the card-number defect (§5.5): the original writes `"123"` into the credit-card number and asserts nothing about it.
5. **The fix (30 s).** Show the diff in §8 and the 20 assertions.
6. **The numbers (45 s).** Baseline vs. after table from §9.2. State the conditions plainly: *"10 sequential Chromium runs against the sandbox; the flow completed in 0/10 before and 10/10 after."* If time allows, add the shallow-fix row — *"and with only the reported bug patched it was still 0/10."*
7. **Limitations (30 s).** Shared sandbox account; the order list is capped at 7 and the oldest entry is auto-deleted; 10 runs is a small sample; the "before" number is unusually bad because the suite had never been run in CI.

**The one-sentence answer:** *"AI turned a red, silently-wrong test into a green test that actually proves the purchase — 0 % → 100 % flow completion over 10 runs, and it found 4 real defects, 3 of which no failing test would ever have reported."*

---

## 11. Limitations & honest caveats

1. **The "before" baseline is unusually bad.** `0 %` completion is not a typical flake rate — the suite had simply never been run in CI, so it failed at the first broken step every time. Present it as *"the test was red"*, not *"the test was flaky"*. A flakiness comparison (repeat-fail vs. random-fail) would need a suite that was already mostly green.
2. **Small sample.** 10 runs per configuration. Enough to expose a deterministic failure; not enough to characterise a true flake rate. Say so.
3. **Shared sandbox account.** `salim@salim.com` is shared. Other people's orders appear in the same order list, and the app keeps only the **last 7** orders (`* If orders Will be more than 7 your last order will get deleted`). The AI-assisted test deletes its own order and looks its order up **by ID** rather than by position, which makes it robust to that churn — but the environment is still not yours.
4. **Wall-clock comparison is not apples-to-apples.** The baseline burns 10 s per run on a locator timeout. Reporting "the fixed suite is faster" would be technically true and analytically meaningless. The honest framing is that the fixed suite *completes* the flow, where the baseline never did.
5. **The order-ID format assertion is deliberate but brittle.** `expect(orderId).toMatch(/^[0-9a-f]{24}$/)` encodes the observed MongoDB ObjectId shape. If the app changes the format, this assertion fails loudly — which is the intent, but it is a coupling.
6. **Credentials are still hard-coded** in these files so the checkpoint is runnable out of the box. Do not commit this pattern to a real repository (§6.3).
7. **Every purchase creates a real order** on the sandbox. Repeated measurement runs have already created dozens of orders on this account.
8. **The AI was not left unsupervised.** Every claim in this document is backed by a command that was run. The value came from the *loop* — propose → probe → measure — not from the model's first answer.

---

## 12. Appendix — quick reference

### The four defects

| # | Severity | Location | Symptom | Root cause |
| --- | --- | --- | --- | --- |
| 1 | 🔴 Blocker | L51 | 10 s timeout | Suggestions are `<button>`, not ARIA `option`; glyph pollutes the accessible name |
| 2 | 🔴 Blocker | L53 | `toHaveValue` fails | Locator resolves to a `<label>`; `toHaveValue` needs an input |
| 3 | 🟠 High | L42–45 | **silent** — wrong card number submitted | Positional `.nth(n)` over a mixed-class selector |
| 4 | 🔴 Blocker | L59/68/76 | **silent** wrong row + always-failing assert | `split(" ").pop()` on `" | <id> | "` returns `""` |

### Useful commands

```powershell
# Single run, line reporter
npx playwright test tests/ai-checkpoint/ClientAppNewTest.AI.spec.js --reporter=line --workers=1

# Repeat for measurement
npx playwright test <file> --repeat-each=10 --workers=1 --reporter=line

# Inspect the last failure
npx playwright show-trace test-results\<test-name>\trace.zip
```

### Evidence artifacts

| Artifact | What it proves | How to run |
| --- | --- | --- |
| `probes/probe-dom.probe.js` | The 6 checkout inputs, their classes and DOM order (§5.5) | `npx playwright test --config=playwright.probe.config.js probe-dom` |
| `probes/probe-struct.probe.js` | Ancestor chains, sibling labels, `name="coupon"`, and that `toHaveValue` fails on a `<label>` (§5.4) | `… probe-struct` |
| `probes/probe-locators.probe.js` | The 10-candidate locator matrix (§5.3) | `… probe-locators` |
| `probes/probe-flow.probe.js` | Order label format, order-row structure, `.col-text` (§5.6) | `… probe-flow` |
| `probes/probe-assert.probe.js` | The empty-string order ID, measured directly | `… probe-assert` |
| `probes/probe-delete.probe.js` | The delete flow and the 7-order cap (§7.1) | `… probe-delete` |
| `test-results/…/error-context.md` | The page snapshot Playwright captured at the point of failure | — |

---

## 13. Appendix — the complete improved spec

`tests/ai-checkpoint/ClientAppNewTest.AI.spec.js`, verbatim. Read the numbered comments: each block maps to one requirement outcome from §4.2.

```js
/**
 * ClientAppNewTest.AI.spec.js
 *
 * AI-assisted rewrite of tests/ClientAppNewTest.spec.js.
 * The original file is kept untouched as the measurement baseline.
 *
 * Every change is traceable to a verified defect - see
 * ../../AI-CHECKPOINT-CLIENTAPP.md for the evidence.
 */
const { test, expect } = require("@playwright/test");

const BASE_URL = "https://rahulshettyacademy.com/client";
const TEST_USER = { email: "salim@salim.com", password: "Salimkhan@3" };
const TEST_PRODUCT = "ZARA COAT 3";
const TEST_COUNTRY = "India";

const CARD = {
  number: "4542993192922293",
  cvv: "123",
  nameOnCard: "Salim Khan",
  expiryMonth: "03",
  expiryYear: "31",
};
const COUPON_CODE = "rahulshettyacademy";

/**
 * The checkout form renders each field as
 *   <div class="field"><div>Human Label</div><input ...></div>
 * Addressing fields by their visible label removes the positional
 * `.nth(n)` coupling that silently mis-mapped the card number.
 */
function fieldByLabel(page, label) {
  return page.locator("div.field", { hasText: label }).locator("input");
}

async function login(page) {
  await page.goto(BASE_URL);
  await page.getByPlaceholder("email@example.com").fill(TEST_USER.email);
  await page.getByPlaceholder("enter your passsword").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Login" }).click();
  // Signed-in state is proven by content, not by a sleep.
  await expect(page.locator(".card-body b").filter({ hasText: TEST_PRODUCT })).toBeVisible();
}

test.describe("Client App - AI-assisted purchase flow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("purchase flow - cart, checkout, confirmation and order details all agree", async ({
    page,
  }) => {
    // 1. The product is offered ------------------------------------------------
    const productCard = page.locator(".card-body").filter({ hasText: TEST_PRODUCT });
    await expect(productCard).toBeVisible();
    await productCard.getByRole("button", { name: "Add To Cart" }).click();

    // 2. The cart holds the product we picked ---------------------------------
    await page.locator("[routerlink='/dashboard/cart']").click();
    await expect(page.getByText(TEST_PRODUCT)).toBeVisible();
    await expect(page.getByText("IN STOCK")).toBeVisible();
    await expect(page.getByText("Total", { exact: true })).toBeVisible();

    // 3. Every checkout field receives the right value in the right field ------
    await page.getByRole("button", { name: "Checkout" }).click();
    await expect(fieldByLabel(page, "Credit Card Number")).toBeVisible();

    await fieldByLabel(page, "Credit Card Number").fill(CARD.number);
    await fieldByLabel(page, "CVV Code").fill(CARD.cvv);
    await fieldByLabel(page, "Name on Card").fill(CARD.nameOnCard);
    await page.locator("select.input.ddl").nth(0).selectOption({ label: CARD.expiryMonth });
    await page.locator("select.input.ddl").nth(1).selectOption({ label: CARD.expiryYear });

    // Regression guard: the card number used to be overwritten with "123"
    // because the field was addressed positionally.
    await expect(fieldByLabel(page, "Credit Card Number")).toHaveValue(/^\d{16}$/);
    await expect(fieldByLabel(page, "CVV Code")).toHaveValue(CARD.cvv);
    await expect(fieldByLabel(page, "Name on Card")).toHaveValue(CARD.nameOnCard);

    // 4. The coupon is accepted ------------------------------------------------
    await page.locator("input[name='coupon']").fill(COUPON_CODE);
    await page.getByRole("button", { name: "Apply Coupon" }).click();
    await expect(page.getByText("* Coupon Applied")).toBeVisible();

    // 5. The country is chosen from the suggestion list ------------------------
    await page.getByPlaceholder("Select Country").pressSequentially("ind", { delay: 100 });
    await page.locator(".ta-results").getByText(TEST_COUNTRY, { exact: true }).click();
    await expect(page.getByPlaceholder("Select Country")).toHaveValue(TEST_COUNTRY);

    // The shipping email INPUT, not the <label> that merely displays it.
    await expect(page.locator(".user__name input[type='text']")).toHaveValue(TEST_USER.email);

    // 6. The order is confirmed ------------------------------------------------
    await page.locator(".action__submit").click();
    await expect(page.getByText("Thankyou for the order.")).toBeVisible();
    await expect(
      page.getByText("You can see all the Orders in Orders History Page")
    ).toBeVisible();

    // The confirmation renders as " | <orderId> | " - strip the separators.
    const rawLabel = await page.locator("label.ng-star-inserted").first().textContent();
    const orderId = rawLabel?.replace(/[^a-zA-Z0-9]/g, "");
    expect(orderId).toMatch(/^[0-9a-f]{24}$/);

    // 7. The order is listed exactly once and its details match ---------------
    await page.locator("button[routerlink='/dashboard/myorders']").click();
    await expect(page.locator("tbody tr")).not.toHaveCount(0);

    // Regression guard: the order used to be matched with an empty string,
    // which silently selected the first row of the table.
    const orderRow = page.locator("tbody tr").filter({ hasText: orderId });
    await expect(orderRow).toHaveCount(1);

    await orderRow.getByRole("button", { name: "View" }).click();
    await expect(page.getByText("Thank you for Shopping With Us")).toBeVisible();
    await expect(page.locator(".col-text").first()).toHaveText(orderId);
    await expect(page.getByText(TEST_PRODUCT)).toBeVisible();

    // 8. Cleanup - keep the shared sandbox account repeatable ------------------
    await page.locator("button[routerlink='/dashboard/myorders']").click();
    await expect(page.locator("tbody tr")).not.toHaveCount(0);
    await orderRow.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator("tbody tr").filter({ hasText: orderId })).toHaveCount(0);
  });
});
```
