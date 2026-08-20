const puppeteer = require("puppeteer-core");
const path = require("path");

const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

async function main() {
  const inputPath = path.resolve(process.argv[2]);
  const outPrefix = process.argv[3];
  const browser = await puppeteer.launch({ executablePath: CHROME_PATHS[0], headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1200 });
  await page.emulateMediaType("print");
  const fileUrl = "file:///" + inputPath.replace(/\\/g, "/");
  await page.goto(fileUrl, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");
  await new Promise((r) => setTimeout(r, 400));

  // 전체 페이지 높이 구해서 여러 구간으로 나눠 스크린샷
  const height = await page.evaluate(() => document.body.scrollHeight);
  const chunk = 1400;
  let idx = 0;
  for (let y = 0; y < height; y += chunk) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await new Promise((r) => setTimeout(r, 100));
    await page.screenshot({ path: `${outPrefix}_${String(idx).padStart(2, "0")}.png`, clip: { x: 0, y: 0, width: 900, height: Math.min(chunk, height - y) } });
    idx++;
  }
  await browser.close();
  console.log("done", idx, "shots, total height", height);
}
main().catch((e) => { console.error(e); process.exit(1); });
