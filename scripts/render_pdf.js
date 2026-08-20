// HTML 전자책을 실제 PDF 파일로 렌더링하는 스크립트 (브라우저 인쇄 설정에 의존하지 않음)
// 사용법: node scripts/render_pdf.js <입력.html> <출력.pdf>

const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

async function main() {
  const [, , inputArg, outputArg] = process.argv;
  if (!inputArg || !outputArg) {
    console.error("사용법: node scripts/render_pdf.js <입력.html> <출력.pdf>");
    process.exit(1);
  }

  const inputPath = path.resolve(inputArg);
  const outputPath = path.resolve(outputArg);

  if (!fs.existsSync(inputPath)) {
    console.error("에러: 입력 파일을 찾을 수 없습니다:", inputPath);
    process.exit(1);
  }

  const chromePath = CHROME_PATHS.find((p) => fs.existsSync(p));
  if (!chromePath) {
    console.error("에러: Chrome/Edge 실행 파일을 찾을 수 없습니다.");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
  });

  try {
    const page = await browser.newPage();
    const fileUrl = "file:///" + inputPath.replace(/\\/g, "/");
    await page.goto(fileUrl, { waitUntil: "networkidle0" });

    // Google Fonts가 완전히 로드될 시간을 확보
    await page.evaluateHandle("document.fonts.ready");
    await new Promise((r) => setTimeout(r, 500));

    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
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
