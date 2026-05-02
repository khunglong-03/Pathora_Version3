const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/brain/e01961d3-8c6f-4f9e-9e06-ed18942f13c1/.tempmediaStorage/home_full.png', fullPage: true });
  await browser.close();
})();
