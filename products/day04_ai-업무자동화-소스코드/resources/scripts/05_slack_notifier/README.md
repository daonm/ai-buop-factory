# 05. 카카오톡 · 슬랙 알림 자동화 스크립트

전자책 『야근 없는 사무실』 **방법 7 — 카카오톡 · 슬랙 알림 자동화**에 대응하는 실제 동작 코드입니다.
슬랙은 Incoming Webhook 방식이라 가장 빠르게 시작할 수 있어 슬랙 버전으로 먼저 제공합니다.

## 준비물
1. 슬랙 워크스페이스 → [Incoming Webhooks](https://api.slack.com/messaging/webhooks) 앱 설치
2. 알림 받을 채널을 선택해 Webhook URL 발급 (`https://hooks.slack.com/services/...` 형태)

## 설치
```bash
pip install -r requirements.txt
```

## 사용법
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/여기에-발급받은-값"
python slack_notify.py --value 1250000 --threshold 1000000 --label "오늘 매출"
```
- `--value`가 `--threshold` 이상일 때만 실제로 전송합니다 (전자책 방법 7의 "정말 필요한 순간만 알림" 원칙 반영).
- 먼저 `--dry-run`으로 메시지 내용만 확인해보고, 문구가 마음에 들면 `--dry-run`을 빼고 실행하세요.
- 본인에게 먼저 테스트 채널로 보내본 뒤 실제 대상 채널에 적용하는 걸 권장합니다.

## 카카오톡 알림톡으로 바꾸고 싶다면
카카오톡 채널의 알림톡/친구톡 API는 사전 템플릿 승인이 필요해 슬랙보다 준비 과정이 깁니다. 아래처럼 클로드에게 그대로 요청하면 이 스크립트 구조를 그대로 카카오톡 버전으로 바꿔줍니다.

> 이 슬랙 알림 스크립트(slack_notify.py)를 카카오톡 채널 알림톡 API를 호출하는 버전으로 바꿔줘. 조건 체크 로직(threshold_check)은 그대로 유지하고.

## 조건(threshold_check) 커스터마이징
"매출이 목표치를 넘을 때"가 아니라 다른 조건(예: 재고가 특정 수량 이하로 떨어질 때)으로 바꾸려면 `threshold_check` 함수만 수정하면 됩니다.
