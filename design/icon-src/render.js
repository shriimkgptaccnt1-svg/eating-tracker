// Renders the Trio icon PNGs into assets/ (run from the project root: node design/icon-src/render.js).
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const { trioSvg } = require('./trio-icon');

const out = (f) => path.join(__dirname, '..', '..', 'assets', f);
// Adaptive icon content must sit inside the middle ~66% of the canvas, so the rings are shrunk there.
const jobs = [
  ['icon.png', 1024, { scale: 1 }],
  ['android-icon-foreground.png', 1024, { scale: 0.66 }],
  ['android-icon-monochrome.png', 1024, { scale: 0.66, mono: true }],
  ['splash-icon.png', 1024, { scale: 1 }],
  ['favicon.png', 48, { scale: 1 }],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [file, size, opts] of jobs) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:transparent">${trioSvg({ size, ...opts })}</body></html>`);
    await page.screenshot({ path: out(file), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
    console.log('wrote', file);
  }
  await browser.close();
})();
