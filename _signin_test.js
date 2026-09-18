/* Sign in to the LIVE site as the Chairman and photograph what he sees.
   Every check so far has used stubs; this is the real page, the real Firebase,
   the real password. */
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 400, height: 900 }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));

  await p.goto('https://ewkena2-ops.github.io/klever-reports/?probe=1',
               { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(4000);
  await p.screenshot({ path: '_live_1_signin.png', fullPage: true });

  const sel = await p.$('select');
  if (sel) {
    await sel.selectOption('chairman');
    await p.fill('input[type="password"]', 'pillar-anchor-34-cradle');
    await p.click('button.codego');
    await p.waitForTimeout(9000);
    await p.screenshot({ path: '_live_2_home.png', fullPage: true });
  }
  console.log('console errors:', errs.length ? errs.slice(0, 6) : 'none');
  await b.close();
})();
