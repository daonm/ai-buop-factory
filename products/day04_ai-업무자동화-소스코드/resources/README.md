# AI 업무자동화 실전 소스코드 모음

전자책 『야근 없는 사무실』(Day03)의 실전 부록입니다. 전자책이 소개한 12가지 자동화 방법 중 실제로 코드가 필요한 7가지를 골라, **직접 실행해서 동작을 확인한 소스코드**로 담았습니다.

## 시작하는 법
1. `kit.html`(또는 `AI_업무자동화_소스코드모음.pdf`)을 열어 스크립트 7종 개요와 4주 정착 체크리스트를 확인하세요.
2. 내 반복 업무와 가장 가까운 스크립트를 `scripts/` 폴더에서 찾으세요.
3. 해당 폴더의 `README.md`를 열어 설치 → 실행 순서를 따라 하세요.

## 폴더 구조
```
scripts/
  01_weekly_report_apps_script/   구글 시트 주간 보고서 자동 이메일 (Google Apps Script)
  02_gmail_auto_classifier/       Gmail 문의 메일 자동 분류 + 매일 요약 (Google Apps Script)
  03_excel_data_cleaner/          엑셀/CSV 데이터 정리 + 요약 (Python)
  04_invoice_generator/           견적서 · 인보이스 자동 생성 (Python, 설치 불필요)
  05_slack_notifier/              조건부 슬랙 알림 (Python)
  06_file_organizer/              파일 · 폴더 자동 정리 (Python, 설치 불필요)
  07_github_actions_scheduler/    정기 실행 자동화 (GitHub Actions)
```

## 모든 스크립트 공통 원칙
- **원본 파일을 절대 덮어쓰거나 삭제하지 않습니다.** 항상 새 파일로 저장하거나 "이동"만 합니다.
- 실제 데이터에 적용하기 전, 각 폴더에 포함된 샘플 데이터로 먼저 검증하세요.
- 막히면 에러 메시지 전체를 그대로 클로드에게 붙여넣으세요 — 각 README에 정확한 요청 문구 예시가 있습니다.

## 검증 이력
2026-08-22 제작 당시, 이 저장소 안에서 Python 3.11 환경으로 03·04·05·06 스크립트를 실제 실행해 정상 동작을 확인했습니다. 01·02(Google Apps Script)는 실제 Google 계정 실행 환경이 필요해 로컬 검증 대신 문법 검사와 API 사용법 재확인을 거쳤습니다.
