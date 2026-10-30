const { test } = require('@playwright/test');
const fs = require('fs');

test('read project file', async () => {
  const path = 'c:\\Users\\Salim\\Documents\\Learning\\Playwright\\tests\\WebAPIPart1.spec.js';
  const text = fs.readFileSync(path, 'utf8');
  console.log('---FILE START---');
  console.log(text);
  console.log('---FILE END---');
});
