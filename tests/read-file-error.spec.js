const { test } = require('@playwright/test');
const fs = require('fs');

test('read file and fail', async () => {
  const path = 'c:\\Users\\Salim\\Documents\\Learning\\Playwright\\tests\\WebAPIPart1.spec.js';
  const text = fs.readFileSync(path, 'utf8');
  throw new Error('FILE_CONTENT_START\n' + text + '\nFILE_CONTENT_END');
});
