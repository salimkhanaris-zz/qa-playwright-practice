const { test, expect } = require("@playwright/test");
const { text } = require("node:stream/consumers");

test('EventHub App Registration',async ({page})=>
{
        const email= "salim2@salim.com";
        const password= "Salimkhan@3";
        page.goto("https://eventhub.rahulshettyacademy.com");
        await page.getByText("Register").click();
        await page.getByPlaceholder("you@email.com").fill(email);
        await page.getByTestId("register-password").fill(password);
        await page.getByPlaceholder("Repeat your password").fill(password);
        await page.getByTestId("register-btn").click();
        const emailDisplay=await page.getByTestId("user-email-display").textContent();
        await expect (email===emailDisplay);
        //console.log(await page.locator(".card-body").nth(0).textContent());

}
);
test('Event App Login',async ({page})=>
{
        const email= "salim@salim.com";
        const password= "Salimkhan@3";
        page.goto("https://eventhub.rahulshettyacademy.com");
        await page.getByPlaceholder("you@email.com").fill(email);
        await page.getByRole("textbox",{name: "password"}).fill(password);
        await page.getByRole("button",{name: "Sign In"}).click();
        await page.getByRole("button",{name:"Admin"}).click();

}
);

test('Event End to End',async ({page})=>
{
  const email= "salim@salim.com";
  const password= "Salimkhan@3";
  const evenName = `Test Event ${Date.now()}`;
  await page.goto('https://eventhub.rahulshettyacademy.com/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByTestId('user-email-display')).toContainText(email);
  await page.getByRole('button', { name: 'Admin' }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Manage Events' }).click();
  await page.getByTestId('event-title-input').fill(evenName);
  await page.getByRole('textbox', { name: 'Describe the event…' }).fill('This is a test event');
  await page.getByRole('textbox', { name: 'City*' }).fill('Noida');
  await page.getByRole('textbox', { name: 'Venue*' }).fill('Noida');
  await page.getByRole('textbox', { name: 'Event Date & Time*' }).fill('2027-03-22T18:00');;
  await page.getByRole('spinbutton', { name: 'Price ($)*' }).fill('100');
  await page.getByRole('spinbutton', { name: 'Total Seats*' }).fill('50');
  await page.getByTestId('add-event-btn').click();
  await expect(page.getByText('✓Event created!×')).toBeVisible();
  await page.getByTestId('nav-events').click();
  const eventCard= page.getByTestId('event-card');
  await page.getByTestId('event-card').first().waitFor();
  const myCard= eventCard.filter({hasText: evenName});
  await expect (myCard).toBeVisible();
  const sc1= await myCard.locator(".text-xs.font-semibold.text-emerald-600").textContent();
  const seatcount= sc1.split(" ")[0];
  console.log(seatcount);
  await myCard.getByTestId('book-now-btn').click();
  await expect(page.locator('#ticket-count')).toContainText('1');
  await page.getByRole('textbox', { name: 'Full Name*' }).click();
  await page.getByRole('textbox', { name: 'Full Name*' }).fill('Salim Khan');
  await page.getByTestId('customer-email').click();
  await page.getByTestId('customer-email').fill('salim@khan.com');
  await page.getByRole('textbox', { name: 'Phone Number*' }).click();
  await page.getByRole('textbox', { name: 'Phone Number*' }).fill('9716156888');
  await page.getByRole('button', { name: 'Confirm Booking' }).click();
  await expect(page.getByText('Book Tickets$100per')).toBeVisible();
  await expect(page.getByText('Booking Confirmed! 🎉Your')).toBeVisible();
  const bookRef= await page.locator('.booking-ref.font-mono').textContent();
  console.log(bookRef);
  await page.getByTestId('nav-bookings').click();
  await page.getByTestId('booking-card').first().waitFor();
  //await expect(page.getByTestId('booking-card')).toBeVisible();
  await page.getByTestId('nav-events').click();
  await page.locator(".space-y-4").first().waitFor();
  const bCard= await page.getByTestId("booking-card");
  await expect(bCard.locator("booking-ref").filter({hasText: bookRef}));
  page.goto("https://eventhub.rahulshettyacademy.com/");
  const r1= await myCard.locator(".font-semibold.text-emerald-600").textContent();
  const remSeat= r1.split(" ")[0]
  expect(seatcount===(remSeat-1));
  console.log(remSeat);
});
        
