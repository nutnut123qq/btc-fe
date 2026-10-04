// Scratch: render a Stitch HTML file to PNG. Usage: node stitch_shot.mjs <file.html> <out.png> [WxH]
import { chromium } from 'playwright';
const [file, out, wh = '1600x1000'] = process.argv.slice(2);
const [w, h] = wh.split('x').map(Number);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.goto('file:///' + file.replace(/\\/g, '/'));
await page.waitForTimeout(2500); // fonts + cdn tailwind
await page.screenshot({ path: out });
await browser.close();
console.log('saved', out);
