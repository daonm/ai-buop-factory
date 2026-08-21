// 특정 CSS selector 요소를 스크린샷 (썸네일/표지 검증용, 클라우드 Playwright 사용)
// 사용법: NODE_PATH=/opt/node22/lib/node_modules node scripts/screenshot_element_cloud.js <입력.html> <출력.png> <selector> [width] [height] [scale]
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

async function main() {
  const [, , inputArg, outputArg, selector, widthArg, heightArg, scaleArg] = process.argv;
  const inputPath = path.resolve(inputArg);
  const outputPath = path.resolve(outputArg);
  const width = parseInt(widthArg || "1000", 10);
  const height = parseInt(heightArg || "1000", 10);
  const scale = parseFloat(scaleArg || "2");

  const defaultChromiumDir = fs.existsSync("/opt/pw-browsers")
    ? fs.readdirSync("/opt/pw-browsers").find((d) => d.startsWith("chromium-"))
    : null;
  const defaultExecutable = defaultChromiumDir
    ? `/opt/pw-browsers/${defaultChromiumDir}/chrome-linux/chrome`
    : undefined;

  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || defaultExecutable,
  });
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
    await page.goto("file://" + inputPath, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const el = await page.$(selector);
    if (!el) throw new Error("selector not found: " + selector);
    await el.screenshot({ path: outputPath });
    console.log("saved", outputPath);
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
