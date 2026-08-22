/**
 * 구글 시트 주간 보고서 자동 이메일 발송 (Google Apps Script)
 * ------------------------------------------------------------
 * 전자책 『야근 없는 사무실』 방법 2에 대응하는 실제 동작 코드입니다.
 *
 * 설치 방법
 * 1) 보고서로 만들 스프레드시트를 연다.
 * 2) 상단 메뉴 확장 프로그램 → Apps Script 를 클릭한다.
 * 3) 기본 생성된 코드를 지우고 이 파일 전체를 붙여넣는다.
 * 4) 아래 CONFIG 값을 내 시트 구조에 맞게 수정한다.
 * 5) 함수 목록에서 sendWeeklyReport 를 선택해 한 번 수동 실행 → 권한 승인.
 * 6) 왼쪽 메뉴 "트리거"(시계 아이콘) → 트리거 추가 → sendWeeklyReport,
 *    시간 기반 트리거, "주 단위 타이머", "월요일", "오전 9시~10시"로 설정.
 */

const CONFIG = {
  SHEET_NAME: "매출",       // 데이터가 있는 시트 탭 이름
  DATE_COL: 1,               // 날짜 컬럼 (A=1)
  AMOUNT_COL: 2,              // 합계를 낼 금액 컬럼 (B=2)
  HEADER_ROW: 1,               // 헤더가 있는 행 번호
  RECIPIENT_EMAIL: "team@example.com", // 받을 이메일 주소 (여러 명이면 쉼표로 구분)
  REPORT_TITLE: "주간 매출 리포트",
};

function sendWeeklyReport() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    throw new Error(`시트를 찾을 수 없습니다: ${CONFIG.SHEET_NAME}`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= CONFIG.HEADER_ROW) {
    Logger.log("데이터가 없어 리포트를 건너뜁니다.");
    return;
  }

  const numRows = lastRow - CONFIG.HEADER_ROW;
  const dates = sheet.getRange(CONFIG.HEADER_ROW + 1, CONFIG.DATE_COL, numRows, 1).getValues();
  const amounts = sheet.getRange(CONFIG.HEADER_ROW + 1, CONFIG.AMOUNT_COL, numRows, 1).getValues();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  let total = 0;
  let count = 0;
  for (let i = 0; i < numRows; i++) {
    const rowDate = dates[i][0];
    const amount = Number(amounts[i][0]) || 0;
    if (rowDate instanceof Date && rowDate >= oneWeekAgo) {
      total += amount;
      count += 1;
    }
  }

  const average = count > 0 ? Math.round(total / count) : 0;
  const body = buildReportBody(total, count, average);

  MailApp.sendEmail({
    to: CONFIG.RECIPIENT_EMAIL,
    subject: `[${CONFIG.REPORT_TITLE}] ${formatDate(new Date())} 기준`,
    body: body,
  });

  Logger.log(`리포트 발송 완료: 합계 ${total}, 건수 ${count}`);
}

function buildReportBody(total, count, average) {
  return [
    `최근 7일 요약`,
    `- 합계: ${total.toLocaleString("ko-KR")}원`,
    `- 건수: ${count}건`,
    `- 건당 평균: ${average.toLocaleString("ko-KR")}원`,
    ``,
    `이 메일은 Apps Script 트리거로 매주 자동 발송됩니다.`,
  ].join("\n");
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

/**
 * 테스트용: 트리거 설정 없이 바로 실행해서 메일이 잘 오는지 확인할 때 사용.
 * 함수 목록에서 이 함수를 선택해 실행하세요.
 */
function testRunNow() {
  sendWeeklyReport();
}
