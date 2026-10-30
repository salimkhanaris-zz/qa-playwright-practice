// @ts-check
/**
 * Separate config for the AI-checkpoint probe scripts.
 *
 * The probes are evidence-gathering scripts, not part of the test suite.
 * They are named `*.probe.js` so Playwright's default `testMatch`
 * (**\/*.@(spec|test).?(c|m)[jt]s?(x)) never collects them during a
 * normal `npx playwright test` run or in CI.
 *
 * Run one with:
 *   npx playwright test --config=playwright.probe.config.js probe-locators
 *   npx playwright test --config=playwright.probe.config.js   (runs them all)
 */
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/ai-checkpoint/probes",
  testMatch: "**/*.probe.js",
  use: {
    actionTimeout: 10 * 1000,
    browserName: "chromium",
    headless: true,
    screenshot: "on",
    trace: "retain-on-failure",
  },
  timeout: 40 * 1000,
  expect: { timeout: 5000 },
  reporter: "line",
});
