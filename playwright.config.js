// @ts-check
import { defineConfig, devices, expect } from '@playwright/test';
import { trace } from 'node:console';
import { use, useActionState } from 'react';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
const config= ({
  testDir: './tests',
    use: {
    actionTimeout: 30 * 1000,
    browserName :'chromium',
    headless : true,
    screenshot: 'on',
    trace: 'on'   //for log information off on failure
  },
  timeout: 40 *1000,
  expect: {

    timeout: 5000
  },
  reporter: 'html',

});

module.exports= config

