// PDF의 특정 페이지 1장을 정확한 A4 픽셀 크기(794x1123px, 100% 줌)로 캡처 (여백/빈공간 육안 검증용, 클라우드 Playwright 사용)
// screenshot_pdf_pages_cloud.js(연속 스크롤 방식)는 스크롤 애니메이션 도중 캡처되어 페이지 경계가 어긋난 이미지를 만들 수 있음(2026-09-05 Day18에서 확인).
// 이 스크립트는 Chrome 내장 PDF 뷰어의 #page=N 해시로 정확히 이동한 뒤 캡처해 그 문제를 피한다.
// 사용법: NODE_PATH=/opt/node22/lib/node_modules node scripts/screenshot_pdf_page_exact_cloud.js <입력.pdf> <출력.png> <페이지번호>
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

async function main() {
  const [, , inputArg, outputArg, pageNumArg] = process.argv;
  if (!inputArg || !outputArg || !pageNumArg) {
    console.error("사용법: node scripts/screenshot_pdf_page_exact_cloud.js <입력.pdf> <출력.png> <페이지번호>");
    process.exit(1);
  }
  const inputPath = path.resolve(inputArg);
  const outputPath = path.resolve(outputArg);

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
    // A4 at 96dpi = 793.7 x 1122.5px
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await page.goto("file://" + inputPath + "#page=" + pageNumArg, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: outputPath });
    console.log("saved", outputPath);
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
