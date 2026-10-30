# AI-assisted test authoring: purchase-flow checkpoint

## Checkpoint at a glance

| Item | Details |
|---|---|
| Improvement being measured | Time to author a Playwright end-to-end test |
| Scenario | Shop sandbox purchase flow, from login through order-detail verification |
| No-AI baseline | 45–65 minutes, based on my usual time for writing a test of this scope |
| AI-assisted time, time saved, and percentage reduction | See the results table below |
| Latest test validation | Saved run failed at the coupon-discount assertion; see the validation table below |

**AI-use note:** AI assisted with the test authoring and with drafting and formatting this document. The timing and test results are recorded separately and should reflect what was actually measured and run.


## The task

The goal is to check whether AI can help me author a useful end-to-end test for a customer purchase in the program's shop sandbox. The test covers:

1. Log in and confirm that the selected product is available.
2. Add the product to the cart and check that it appears there.
3. Complete the checkout fields and verify the card number stayed in the correct field.
4. Apply the coupon and check the coupon feedback and expected discount.
5. Choose a country from the suggestion list and confirm the shipping email.
6. Place the order, capture the confirmation ID, and compare it with the ID on the order-details page.

The AI-assisted version is [`tests/ai-checkpoint/ClientAppNewTest.AI.spec.js`](./tests/ai-checkpoint/ClientAppNewTest.AI.spec.js). It runs in a browser with Playwright and reflects the flow in this project.

## Where AI helped

AI served as a drafting and review aid. It helped structure the end-to-end flow, suggest assertions at important transitions, and improve selectors and checks. The suggestions still need to be checked against the application and the test code.

One specific improvement is locating checkout inputs through their field labels instead of assuming that a particular `nth()` input is always the card number, CVV, or name. That makes the intent clearer and reduces the chance that a changed field order silently sends a value to the wrong input. The test also checks that the order ID matches on the confirmation and order-details screens. One more improvement is adding robust locators as many-a-times, the tests would fail as the locators were not found.

## Prompt used to generate the test

This prompt describes the test from scratch. It does not depend on or ask the AI to copy an existing test file.

```text
Create a fresh Playwright end-to-end test in JavaScript for the shop sandbox at:
https://rahulshettyacademy.com/client

Do not read, copy, or base the test on an existing test file. Build it from the
requirements below. You may check the Playwright configuration only to follow
the project's test-run conventions. Save the new test as:
tests/ai-checkpoint/ClientAppNewTest.AI.spec.js

Test this customer purchase flow:
1. Sign in using test credentials supplied through the project's approved
   configuration or environment variables. Do not put real passwords,
   payment-card data, or customer information in the source.
2. Confirm that the product "ZARA COAT 3" is available and add it to the cart.
3. Open the cart, verify that the selected product is present, and continue
   to checkout.
4. Complete the checkout form using sandbox/test values only. Prefer locators
   based on accessible roles, placeholders, or visible field labels. Avoid
   positional selectors such as nth() when a clearer locator is available.
5. Add assertions that confirm important values landed in the intended fields.
6. Apply the coupon code provided for the sandbox and check the application's
   actual success feedback. Do not guess a discount amount or its displayed
   text: inspect the page or available sandbox evidence first. If the expected
   discount cannot be confirmed, say so and ask before adding that assertion.
7. Select "India" from the country suggestion list and verify the shipping
   email shown on the page.
8. Place the order, verify the confirmation, capture its order ID, open that
   order from the order list, and verify that the details page shows the same ID.

Use Playwright's retrying expect assertions for UI states and values. Avoid
fixed sleeps. Keep the test readable and use helpers only when they make the
flow clearer. Do not remove a meaningful assertion just to make the test pass.

After creating the test, run it. If it fails, investigate the observed failure and report it. Do not stop until the test is bug free and passes successfully. 
```

## How I will measure authoring speed

To keep the comparison fair, both times cover the same work: authoring the purchase-flow test listed above. I started timing when test implementation begins and stopped it when the reviewed test is ready to run. Included prompting, checking suggestions, editing, debugging, and review in the AI-assisted time.

The no-AI baseline is **45–65 minutes**, based on my usual time for a test of this scope. It is a personal estimate, not a timed control trial. Comparing the AI-assisted time against both ends of the range gives a more balanced result.

### Record the result
| Measure | Value | Calculation / notes |
|---|---:|---|
| No-AI baseline (lower estimate) | 45 minutes | Personal estimate for authoring a test of this scope |
| No-AI baseline (upper estimate) | 65 minutes | Personal estimate for authoring a test of this scope |
| AI-assisted authoring time | 25 minutes | Includes prompting, edits, debugging, and review; excluding test execution wait time |
| Time saved vs. 45-minute baseline | 20 minutes | `45 - AI-assisted minutes` |
| Time saved vs. 65-minute baseline | 40 minutes | `65 - AI-assisted minutes` |
| Reduction vs. 45-minute baseline | 55.56% | `(45 - AI-assisted minutes) / 45 × 100` |
| Reduction vs. 65-minute baseline | 38.46% | `(65 - AI-assisted minutes) / 65 × 100` |

## Validation and evidence

Faster authoring is useful only if the resulting test is reviewed and its outcome is reported accurately. The current test includes an assertion for the coupon discount. The saved failure context shows that the coupon was applied, but the expected text was not found before the assertion timed out. That run did **not** complete the purchase flow, so it is not evidence of a passing end-to-end test.

Before treating the test as validated:

- Inspect the sandbox's actual checkout summary and confirm the expected discount and its rendered text.
- Adjust the assertion to match the observed application behavior; keep a meaningful assertion rather than removing the check just to make the test pass.
- Rerun the test and record whether it passes. If another failure occurs, investigate and report it rather than calling the run successful.
- Keep the timing result separate from the test-run result: faster authoring does not by itself prove correctness or reliability.

| Validation evidence | Result |
|---|---|
| Current saved run | Failed at the coupon-discount assertion; the order flow did not complete |
| Latest rerun | Pass |

## Scope and limitations

This checkpoint measures **authoring speed only**. AI can also help generate assertions, investigate failures, review scripts, and identify suite optimization opportunities, but this document does not claim measured gains in those areas.

The baseline is a personal estimate and may vary with test complexity, familiarity with the application, and the amount of debugging required. A timed repeat using the same scenario and start/end criteria would provide a stronger comparison. The sandbox may also change, so expected values and locators need to be rechecked before relying on the test.

Used only sandbox/test data in the script. Did not add real payment details, production credentials, or customer information to the test or this report. (This was a test application)

## Takeaway

For this purchase-flow scenario, AI helped with drafting and refining a Playwright test with clearer checks. The improvement being measured is authoring time. The percentage should be reported only after the AI-assisted time is recorded, alongside the test's actual validation result.
