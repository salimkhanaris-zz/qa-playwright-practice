const { test, expect } = require("@playwright/test");
const { sign } = require("node:crypto");

test('Browser Context Playwright Test',async ({browser})=>
{

        const context= await browser.newContext();
        const page= await context.newPage();
        await page.goto("https://sauce-demo.myshopify.com/")
        // await page.title();
        await expect(page).toHaveTitle("Sauce Demo")


    

});

test('Page Context Playwright test',async ({page})=>
{
//playwright code
        const uname= page.locator("input#username"); 
        const pass= page.locator("input#password"); 
        const signIn= page.locator("#signInBtn");
        const cardTitles=page.locator(".card-body a");
        await page.goto("https://rahulshettyacademy.com/loginpagePractise/")
        console.log(await page.title());
        //type or fill -used for entering into textboxes
        await uname.fill("rahulshetty");
        await pass.fill("Learning@830$3mK2");
        await page.locator("#terms").click();
        await signIn.click();
        //await page.locator("[style*='block']").textContent();
        const textmessage= page.locator("[style*='block']");
        await expect(textmessage).toContainText("Incorrect");
        await uname.fill("");
        await uname.fill("rahulshettyacademy");
        await signIn.click();
        console.log(await cardTitles.first().textContent());
        console.log(await cardTitles.nth(1).textContent());
        console.log(await cardTitles.allTextContents());

});

test('UI Controls',async ({page})=>
{
//playwright code
        const uname= page.locator("input#username"); 
        const pass= page.locator("input#password"); 
        const signIn= page.locator("#signInBtn");
        const cardTitles=page.locator(".card-body a")
        const doclink= page.locator("[href*='documents-req']");
        await page.goto("https://rahulshettyacademy.com/loginpagePractise/")
        const dropdown= page.locator("select.form-control");
        console.log(await page.title());
        await dropdown.selectOption("consult");
        //To pause execution
        //await page.pause();
        await page.locator("#usertype").last().click();
        await expect(page.locator("#usertype").last()).toBeChecked();
        await page.locator("#okayBtn").click();
        await expect(doclink).toHaveAttribute("class","blinkingText");
        //await page.pause();

});

test('Child Windows Handling',async ({browser})=>{

        const context= await browser.newContext();
        const page= await context.newPage();
        const uname= page.locator("input#username"); 
        await page.goto("https://rahulshettyacademy.com/loginpagePractise/");
        const doclink= page.locator("[href*='documents-req']");
        const [newPage]=await Promise.all(
        [
        context.waitForEvent('page'), //listens for any new page
        doclink.click(),//new page opens
        ])

        const text = await newPage.locator(".red").textContent();
        const ArrText= text.split("@");
        const ArrText2= ArrText[1].split(" ")[0];
        console.log(text);
        console.log (ArrText);
        console.log (ArrText2);
        await uname.fill(ArrText2);
        console.log(await uname.inputValue());

});