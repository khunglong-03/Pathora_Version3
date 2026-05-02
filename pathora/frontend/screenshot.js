const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/brain/e01961d3-8c6f-4f9e-9e06-ed18942f13c1/.tempmediaStorage/home_fixed3.png' });
  await browser.close();
})();
