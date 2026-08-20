// 사용자가 직접 로그인할 수 있도록 눈에 보이는(headless:false) 크롬을 띄우는 스크립트.
// remote-debugging-port를 열어두고, 별도 프로필 디렉토리(세션 유지)를 사용해서
// 나중에 다른 스크립트가 이 브라우저에 다시 연결해 자동화를 이어갈 수 있게 한다.

const puppeteer = require("puppeteer-core");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PROFILE_DIR = path.resolve(__dirname, ".browser-profile");
const START_URL = process.argv[2] || "https://www.latpeed.com/";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    userDataDir: PROFILE_DIR,
    args: [
      "--remote-debugging-port=9222",
      "--no-first-run",
      "--no-default-browser-check",
      "--window-size=1280,900",
    ],
  });
  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());
  await page.goto(START_URL, { waitUntil: "domcontentloaded" });
  console.log("브라우저 열림. 이 창에서 직접 로그인하세요. (포트 9222로 재연결 가능)");
  // 스크립트 프로세스를 계속 살려서 브라우저가 같이 종료되지 않게 함
  await new Promise(() => {});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
