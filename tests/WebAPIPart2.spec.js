const { test, expect } = require("@playwright/test");
let webContext;

test.beforeAll(async({browser})=>
{
        const context= await browser.newContext();
        const page= await context.newPage();
        page.goto("https://rahulshettyacademy.com/client");
        await page.locator('#userEmail').fill("salim@salim.com")
        await page.locator("#userPassword").fill("Salimkhan@3");
        await page.locator("#login").click();
        //console.log(await page.locator(".card-body b").nth(0).textContent());
        //If we only want AllTextConents method, use this
        await page.waitForLoadState('networkidle');
        await context.storageState({path: 'state.json'});
        webContext= await browser.newContext({storageState: 'state.json'});

});

test('Client End to End',async ({})=>
{
        const page= await webContext.newPage();
        const products= page.locator(".card-body");
        const productName= 'ZARA COAT 3';
        page.goto("https://rahulshettyacademy.com/client");
        await page.locator(".card-body b").first().waitFor();
        console.log(await page.locator(".card-body b").allTextContents());
        const count= await products.count();

        for(let i=0;i<count;++i)
        {
              
              if(await products.nth(i).locator("b").textContent()===productName)
              {
                //add to cart
                //await products.nth(i).locator("text= Add To Cart").click();
                await products.nth(i).locator("text= Add To Cart").click();
                break;
              }
        }
        await page.locator("[routerlink='/dashboard/cart']").click();
        await page.locator("div li").first().waitFor();
        const bool= await page.locator("h3:has-text('ZARA COAT 3')").isVisible();
        expect(bool).toBeTruthy();
        await page.locator('button:has-text("Checkout")').click();
        const countryName= " India";
        //await page.pause();
        await page.locator("input.input.txt.text-validated").first().fill("4542993192922293");
        await page.locator("select.input.ddl").nth(0).selectOption({label: '03'});
        await page.locator("select.input.ddl").nth(1).selectOption({label: '31'});
        await page.locator('input.input.txt').nth(0).fill("123");
        await page.locator('input.input.txt').nth(1).fill("Salim");
        await page.locator('input.input.txt').nth(2).fill("Khan");
        await page.locator('input.input.txt').nth(3).fill("rahulshettyacademy");
        await page.locator('button:has-text("Apply Coupon")').click();
        await page.locator('p.mt-1.ng-star-inserted').waitFor();
        await expect(await page.locator('p:has-text("* Coupon Applied")').isVisible()).toBeTruthy();
        await page.locator("[placeholder*='Country']").pressSequentially("ind",{delay: 150});
        const dropdown= page.locator(".ta-results");
        await dropdown.waitFor();
        const optionsCount=await dropdown.locator("button").count();
        for(let i=0;i<optionsCount;i++)
        {
                const text= await dropdown.locator("button").nth(i).textContent();
                if(text===countryName)
                {
                      await dropdown.locator("button").nth(i).click();  
                      break;
                }
        }
        expect(page.locator(".user__name [type*='text']").first()).toHaveText("salim@salim.com");
        await page.locator(".action__submit").click();
        await expect(page.locator(".hero-primary")).toHaveText(" Thankyou for the order. ")
        const orderId= await page.locator("label.ng-star-inserted").textContent();
        //orderId.split(" ");
        console.log(orderId);
        const orderLink= await page.locator("button[routerlink='/dashboard/myorders']");
        await orderLink.click();
        await page.locator("tbody").waitFor();
        const rows = await page.locator("tbody tr");
        for(let i=0;i<await rows.count();i++)
        {
                const rowOrderID= await rows.nth(i).locator("th").textContent();
                if(orderId.includes(rowOrderID))
                {
                        await rows.nth(i).locator("button.btn.btn-primary").click();
                        break;
                }
                
        }
        //await page.pause();
        await page.waitForLoadState('networkidle');
        const orderDetailsID= await page.locator(".col-text").textContent();
        await expect(orderId.includes(orderDetailsID)).toBeTruthy();
}
);