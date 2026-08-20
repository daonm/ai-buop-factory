const puppeteer = require("puppeteer-core");
const path = require("path");

async function main() {
  const inputPath = path.resolve(process.argv[2]);
  const pageNum = process.argv[3];
  const outPath = process.argv[4];
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1400 });
  const fileUrl = "file:///" + inputPath.replace(/\\/g, "/") + "#page=" + pageNum;
  await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: outPath });
  await browser.close();
  console.log("done page", pageNum);
}
main().catch((e) => { console.error(e); process.exit(1); });
