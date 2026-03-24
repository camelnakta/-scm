
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://3000-imurtovef2zh2o7d4p0sn-02b9cc79.sandbox.novita.ai/login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/sc_login.png' });
  await page.fill('input[type=text]', 'admin');
  await page.fill('input[type=password]', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL('**dashboard**', { timeout: 15000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/sc_dash.png' });
  await page.goto('https://3000-imurtovef2zh2o7d4p0sn-02b9cc79.sandbox.novita.ai/admin/users', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/sc_users.png' });
  await page.goto('https://3000-imurtovef2zh2o7d4p0sn-02b9cc79.sandbox.novita.ai/orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/sc_orders.png' });
  await b.close();
  console.log('OK');
})();
