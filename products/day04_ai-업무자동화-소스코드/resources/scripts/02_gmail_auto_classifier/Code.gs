/**
 * Gmail 문의 메일 자동 분류 + 매일 요약 발송 (Google Apps Script)
 * ------------------------------------------------------------
 * 전자책 『야근 없는 사무실』 방법 3에 대응하는 실제 동작 코드입니다.
 * "확실한 것만 자동 분류하고, 애매한 건 사람이 보는 라벨로 모으기" 원칙을 그대로 코드로 옮겼습니다.
 *
 * 설치 방법
 * 1) https://script.google.com 에서 새 프로젝트를 만든다 (스프레드시트에 종속시킬 필요 없음).
 * 2) 이 파일 전체를 붙여넣는다.
 * 3) RULES를 내 상황에 맞게 수정한다 (제목/발신자에 포함된 키워드 → 붙일 라벨).
 * 4) classifyInbox 함수를 한 번 수동 실행 → 권한 승인 (Gmail 접근 허용).
 * 5) 트리거(시계 아이콘) → classifyInbox, 시간 기반, "분 단위 타이머" 10~15분 간격으로 등록.
 * 6) 매일 아침 요약 메일을 원하면 sendDailySummary도 트리거에 별도로 등록 (매일, 오전 8시~9시).
 */

const RULES = [
  { label: "문의", keywords: ["문의", "질문", "상담", "궁금"] },
  { label: "주문", keywords: ["주문", "결제", "구매", "환불"] },
  { label: "스팸의심", keywords: ["광고", "무료체험", "당첨"] },
];
const FALLBACK_LABEL = "확인필요"; // 규칙에 안 걸리는 메일은 여기로 모아서 사람이 직접 확인
const SUMMARY_RECIPIENT = "me@example.com";

function classifyInbox() {
  const threads = GmailApp.search("in:inbox is:unread newer_than:1d");
  threads.forEach((thread) => {
    const subject = thread.getFirstMessageSubject() || "";
    const snippet = thread.getMessages()[0].getPlainBody().slice(0, 300);
    const haystack = (subject + " " + snippet).toLowerCase();

    const matched = RULES.find((rule) =>
      rule.keywords.some((kw) => haystack.includes(kw.toLowerCase()))
    );
    const labelName = matched ? matched.label : FALLBACK_LABEL;

    applyLabel(thread, labelName);
  });

  Logger.log(`분류 완료: ${threads.length}건 처리`);
}

function applyLabel(thread, labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    label = GmailApp.createLabel(labelName);
  }
  thread.addLabel(label);
}

/**
 * 어제 하루 동안 각 라벨에 몇 건이 쌓였는지 요약해서 아침에 메일로 보낸다.
 */
function sendDailySummary() {
  const counts = RULES.map((rule) => rule.label).concat(FALLBACK_LABEL).map((labelName) => {
    const label = GmailApp.getUserLabelByName(labelName);
    if (!label) return { labelName, count: 0 };
    const threads = label.getThreads(0, 200).filter((t) => isFromYesterday(t.getLastMessageDate()));
    return { labelName, count: threads.length };
  });

  const body = counts.map((c) => `- ${c.labelName}: ${c.count}건`).join("\n");

  MailApp.sendEmail({
    to: SUMMARY_RECIPIENT,
    subject: `[문의 메일 요약] ${formatDate(new Date())}`,
    body: `어제 들어온 문의 메일 요약입니다.\n\n${body}\n\n"${FALLBACK_LABEL}" 라벨은 규칙에 안 걸린 메일이니 직접 확인해주세요.`,
  });
}

function isFromYesterday(date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}
