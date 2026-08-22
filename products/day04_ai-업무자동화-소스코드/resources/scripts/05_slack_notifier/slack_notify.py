#!/usr/bin/env python3
"""
슬랙 알림 자동화 스크립트
------------------------------------
슬랙 Incoming Webhook으로 조건이 맞을 때만 메시지를 보냅니다.
"알림이 너무 잦으면 무시당한다"는 전자책 방법 7의 조언을 반영해,
기본적으로 조건 함수(threshold_check)를 통과한 경우에만 실제 전송합니다.

사용법:
    export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
    python slack_notify.py --value 1250000 --threshold 1000000 --label "오늘 매출"

    # 웹훅 없이 메시지만 미리 확인하고 싶을 때
    python slack_notify.py --value 1250000 --threshold 1000000 --label "오늘 매출" --dry-run
"""
import argparse
import os
import sys

import requests


def build_message(label: str, value: float, threshold: float) -> str:
    return (
        f"*{label} 알림*\n"
        f"현재 값: `{value:,.0f}` (기준 `{threshold:,.0f}` 초과)\n"
        f"확인이 필요합니다."
    )


def threshold_check(value: float, threshold: float) -> bool:
    """정말 사람이 봐야 하는 순간만 True를 반환하도록 여기서 조건을 조정하세요."""
    return value >= threshold


def send_slack(webhook_url: str, text: str) -> None:
    resp = requests.post(webhook_url, json={"text": text}, timeout=10)
    resp.raise_for_status()


def main():
    parser = argparse.ArgumentParser(description="조건을 만족할 때만 슬랙으로 알림 전송")
    parser.add_argument("--value", type=float, required=True, help="비교할 현재 값 (예: 오늘 매출)")
    parser.add_argument("--threshold", type=float, required=True, help="이 값 이상일 때만 알림")
    parser.add_argument("--label", default="알림", help="메시지 제목")
    parser.add_argument("--webhook", help="슬랙 Incoming Webhook URL (미지정 시 SLACK_WEBHOOK_URL 환경변수 사용)")
    parser.add_argument("--dry-run", action="store_true", help="실제 전송 없이 메시지 내용만 출력")
    args = parser.parse_args()

    if not threshold_check(args.value, args.threshold):
        print(f"조건 미충족 ({args.value:,.0f} < {args.threshold:,.0f}) — 알림을 보내지 않습니다.")
        return

    message = build_message(args.label, args.value, args.threshold)

    if args.dry_run:
        print("[dry-run] 아래 메시지가 전송될 예정입니다:\n")
        print(message)
        return

    webhook_url = args.webhook or os.environ.get("SLACK_WEBHOOK_URL")
    if not webhook_url:
        sys.exit("에러: --webhook 또는 SLACK_WEBHOOK_URL 환경변수를 설정하세요.")

    send_slack(webhook_url, message)
    print("전송 완료")


if __name__ == "__main__":
    main()
