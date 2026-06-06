const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Listen to console
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  // Listen to dialogs (alert/confirm/prompt)
  page.on('dialog', async dialog => {
    console.log('BROWSER DIALOG:', dialog.type(), dialog.message());
    await dialog.dismiss();
  });

  // Listen to failed network requests
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  // Listen to request responses
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('API RESPONSE:', response.url(), response.status());
    }
  });

  console.log('Navigating to home...');
  await page.goto('http://localhost');

  // Wait for and click Sign In button
  console.log('Clicking Sign In...');
  const signInButton = await page.waitForSelector('button ::-p-text(Sign In)');
  await signInButton.click();

  // Wait for login form
  console.log('Filling login form...');
  const emailInput = await page.waitForSelector('input[placeholder="Email Address"]');
  await emailInput.type('thehieuguide@gmail.com');
  const passwordInput = await page.waitForSelector('input[placeholder="Password"]');
  await passwordInput.type('thehieu03');

  // Click Submit
  const submitButton = await page.waitForSelector('div.modal-box button ::-p-text(Sign In), button ::-p-text(Sign In)');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    submitButton.click(),
  ]);
  console.log('Login submitted.');

  // Go to operations page
  console.log('Navigating to operations detail...');
  await page.goto('http://localhost/tour-guide/operations/019e9925-6598-7781-95b4-d71cd951ed6b', { waitUntil: 'networkidle0' });

  // Find the complete button
  console.log('Finding Hoàn Thành button...');
  const completeButtons = await page.$$('button ::-p-text(Hoàn Thành)');
  console.log(`Found ${completeButtons.length} complete buttons.`);

  if (completeButtons.length > 0) {
    console.log('Clicking first complete button...');
    await completeButtons[0].click();
    console.log('Click action executed.');
    
    // Wait for 3 seconds to see if any network request or dialog is triggered
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log('No complete button found. Let\'s print page HTML content briefly.');
    const content = await page.content();
    console.log(content.substring(0, 1000));
  }

  await browser.close();
}

main().catch(console.error);
