// HTML을 PDF로 렌더링하는 스크립트 (클라우드/Linux 실행 환경용, Playwright + 사전 설치된 Chromium 사용)
// render_pdf.js는 로컬 Windows Chrome 경로 전용이라 클라우드 세션에서는 이 스크립트를 사용한다.
// 사용법: NODE_PATH=/opt/node22/lib/node_modules node scripts/render_pdf_cloud.js <입력.html> <출력.pdf>

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

async function main() {
  const [, , inputArg, outputArg] = process.argv;
  if (!inputArg || !outputArg) {
    console.error("사용법: node scripts/render_pdf_cloud.js <입력.html> <출력.pdf>");
    process.exit(1);
  }

  const inputPath = path.resolve(inputArg);
  const outputPath = path.resolve(outputArg);

  if (!fs.existsSync(inputPath)) {
    console.error("에러: 입력 파일을 찾을 수 없습니다:", inputPath);
    process.exit(1);
  }

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
    const page = await browser.newPage();
    const fileUrl = "file://" + inputPath;
    await page.goto(fileUrl, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);

    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
    });

    console.log("PDF 생성 완료:", outputPath);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
