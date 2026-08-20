// 특정 크기의 HTML을 정확히 그 크기로 스크린샷 (썸네일 제작용)
const puppeteer = require("puppeteer-core");
const path = require("path");

async function main() {
  const inputPath = path.resolve(process.argv[2]);
  const outPath = path.resolve(process.argv[3]);
  const size = parseInt(process.argv[4] || "1000", 10);
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
  });
  const page = await browser.newPage();
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 2 });
  const fileUrl = "file:///" + inputPath.replace(/\\/g, "/");
  await page.goto(fileUrl, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: outPath });
  await browser.close();
  console.log("saved", outPath);
}
main().catch((e) => { console.error(e); process.exit(1); });
