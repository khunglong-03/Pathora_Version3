const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
  const html = await page.evaluate(() => {
    const card = document.querySelector('.grid-cols-2 .col-span-1.row-span-2');
    if (!card) return 'Card not found';
    return card.outerHTML;
  });
  console.log(html);
  await browser.close();
})();
