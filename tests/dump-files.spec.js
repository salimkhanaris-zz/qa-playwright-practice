const fs = require('fs');
const path = require('path');

console.log('--- LoginPage.js ---');
console.log(fs.readFileSync(path.join(__dirname, '..', 'pages', 'LoginPage.js'), 'utf8'));
console.log('--- ShopPage.js ---');
console.log(fs.readFileSync(path.join(__dirname, '..', 'pages', 'ShopPage.js'), 'utf8'));
console.log('--- WebAPIPart1.spec.js ---');
console.log(fs.readFileSync(path.join(__dirname, 'WebAPIPart1.spec.js'), 'utf8'));
