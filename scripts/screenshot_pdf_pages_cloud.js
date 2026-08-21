// PDF를 브라우저 내장 뷰어로 열어 각 페이지를 스크린샷 (클라우드 Playwright, 여백 육안 확인용)
// 사용법: NODE_PATH=/opt/node22/lib/node_modules node scripts/screenshot_pdf_pages_cloud.js <입력.pdf> <출력디렉토리> <페이지수>
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

async function main() {
  const [, , inputArg, outDirArg, pagesArg] = process.argv;
  const inputPath = path.resolve(inputArg);
  const outDir = path.resolve(outDirArg);
  const totalPages = parseInt(pagesArg || "20", 10);
  fs.mkdirSync(outDir, { recursive: true });

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
    // A4 세로 비율(1:1.414)에 맞춰 한 페이지가 정확히 뷰포트 하나에 꽉 차게 설정 (여러 페이지가 한 화면에 섞여 보이는 것 방지)
    const width = 850;
    const height = 1250; // 뷰포트 상단 = 항상 완전한 한 페이지, 하단엔 다음 페이지 일부만 미리보기로 걸침
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto("file://" + inputPath + "#zoom=page-fit", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.mouse.click(Math.floor(width / 2), Math.floor(height / 2));
    await page.keyboard.press("Home");
    await page.waitForTimeout(500);
    for (let i = 1; i <= totalPages; i++) {
      await page.screenshot({ path: path.join(outDir, `page_${String(i).padStart(2, "0")}.png`) });
      await page.keyboard.press("PageDown");
      await page.waitForTimeout(800);
    }
    console.log("done", totalPages, "pages ->", outDir);
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
