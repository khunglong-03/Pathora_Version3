const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });

  // Scroll slowly to the bottom
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  for (let i = 0; i < scrollHeight; i += 400) {
    await page.evaluate((y) => window.scrollTo(0, y), i);
    await page.waitForTimeout(200); // Wait for lazy load
  }
  await page.waitForTimeout(2000); // Wait for final images
  await page.screenshot({ path: '/Users/mac/.gemini/antigravity/brain/e01961d3-8c6f-4f9e-9e06-ed18942f13c1/.tempmediaStorage/home_full_scrolled.png', fullPage: true });
  await browser.close();
})();
