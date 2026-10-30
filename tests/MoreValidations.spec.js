const {test, expect} = require('@playwright/test')

test('Popup Validations', async({page}) =>
{

    await page.goto("https://rahulshettyacademy.com/AutomationPractice/");
//    await page.goto("https://www.google.com/");
  //  await page.goBack();
    await expect(page.locator("#displayed-text")).toBeVisible();
    await page.locator("#hide-textbox").click();
    await expect(page.locator("#displayed-text")).toBeHidden();
    await page.locator("#confirmbtn").click();
    await page.on("dialog",dialog =>dialog.accept());
    await page.locator("#mousehover").hover();
    await page.pause();
    //Switch to iframe within a page
    const framePage= page.frameLocator("#courses-iframe");
    await framePage.locator("li a[href*='lifetime-access']:visible").click();
    const text1= await framePage.locator(".text h2").textContent();
    const text2= text1.split(" ")[1];
    console.log(text2);

});

test('Screenshot and Visual Comaprison', async({page}) =>
{

      await page.goto("https://rahulshettyacademy.com/AutomationPractice/");
    await expect(page.locator("#displayed-text")).toBeVisible();
    await page.locator("#displayed-text").screenshot({path: 'PartialSS.png'});
    await page.locator("#hide-textbox").click();
    await page.screenshot({path: 'Screenshot.png'});
    await expect(page.locator("#displayed-text")).toBeHidden();
});

test.only('Visual', async({page}) =>
{
  await page.goto("https://www.flightaware.com/");
  expect(await page.screenshot()).toMatchSnapshot('landing.png');
});