// Scratch: capture local impl screens. Usage: node impl_shot.mjs <out-prefix> [mobile]
import { chromium } from 'playwright';
const [prefix = 'impl', mobile] = process.argv.slice(2);
const vp = mobile ? { width: 390, height: 844 } : { width: 1600, height: 1000 };
const TABS = [
  ['market', null], ['news', 'Tin tức & AI'], ['ai', 'Tin tức & AI'],
  ['research', 'Nghiên cứu'], ['archetype', 'Nghiên cứu'], ['rules', 'Nghiên cứu'],
  ['backtest', 'Nghiên cứu'], ['predict', 'Mô phỏng'], ['paper', 'Mô phỏng'],
  ['binanceHistory', 'Mô phỏng'], ['settings', 'Hệ thống'],
];
const LABEL = {
  market: 'Thị trường', news: 'Tin tức', ai: 'AI', research: 'Nghiên cứu',
  archetype: 'Mẫu nến', rules: 'Rules nến', backtest: 'Backtest',
  predict: 'Dự đoán', paper: 'Paper', binanceHistory: 'Nhật ký Paper BTC',
  settings: 'Cảnh báo',
};
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: vp });
await page.goto('http://127.0.0.1:3210', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
const nav = page.getByTestId(mobile ? 'nav-groups-mobile' : 'nav-groups');
for (const [key, group] of TABS) {
  if (group === null) {
    await nav.getByRole('button', { name: LABEL[key], exact: true }).click();
  } else {
    const g = nav.getByRole('button', { name: group, exact: true });
    await g.click();
    await page.waitForTimeout(300);
    if (key !== 'settings' && LABEL[key] !== group) {
      await page.getByTestId('nav-sub-row').getByRole('button', { name: LABEL[key], exact: true }).click();
    }
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `.impl-shots/${prefix}-${key}${mobile ? '-m' : ''}.png` });
  console.log('shot', key);
}
await browser.close();
