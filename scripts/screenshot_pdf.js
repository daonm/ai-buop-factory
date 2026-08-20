const puppeteer = require("puppeteer-core");
const path = require("path");

async function main() {
  const inputPath = path.resolve(process.argv[2]);
  const outPrefix = process.argv[3];
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1300 });
  const fileUrl = "file:///" + inputPath.replace(/\\/g, "/");
  await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: `${outPrefix}_full.png`, fullPage: true });
  await browser.close();
  console.log("done");
}
main().catch((e) => { console.error(e); process.exit(1); });
