#!/usr/bin/env bash
# 스레드(Threads) 자동 포스팅 스크립트
#
# 사용법:
#   ./scripts/threads_post.sh "포스팅할 텍스트"              → 기본은 dry-run (실제로 안 올라감, 미리보기만)
#   ./scripts/threads_post.sh "포스팅할 텍스트" --live        → 실제로 스레드에 게시
#
# .env 파일에 THREADS_ACCESS_TOKEN, THREADS_USER_ID가 있어야 합니다.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "에러: .env 파일이 없습니다. THREADS_ACCESS_TOKEN, THREADS_USER_ID를 먼저 설정하세요."
  exit 1
fi

# CRLF 방지를 위해 항상 \r 제거하고 로드
set -a
source <(tr -d '\r' < .env)
set +a

if [ -z "${THREADS_ACCESS_TOKEN:-}" ] || [ -z "${THREADS_USER_ID:-}" ]; then
  echo "에러: THREADS_ACCESS_TOKEN 또는 THREADS_USER_ID가 .env에 비어있습니다."
  exit 1
fi

TEXT="${1:-}"
MODE="${2:-}"

if [ -z "$TEXT" ]; then
  echo "사용법: $0 \"포스팅할 텍스트\" [--live]"
  exit 1
fi

if [ "$MODE" != "--live" ]; then
  echo "=== DRY RUN (실제로 게시되지 않습니다) ==="
  echo "게시될 내용:"
  echo "---"
  echo "$TEXT"
  echo "---"
  echo "실제로 올리려면 마지막 인자에 --live 를 추가하세요."
  exit 0
fi

echo "1단계: 게시물 컨테이너 생성 중..."
CREATE_RESPONSE=$(curl -s -X POST "https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads" \
  --data-urlencode "media_type=TEXT" \
  --data-urlencode "text=${TEXT}" \
  --data-urlencode "access_token=${THREADS_ACCESS_TOKEN}")

CREATION_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CREATION_ID" ]; then
  echo "에러: 컨테이너 생성 실패"
  echo "$CREATE_RESPONSE"
  exit 1
fi

echo "컨테이너 생성됨: $CREATION_ID"
echo "2단계: 게시 중..."

sleep 2  # Threads API는 컨테이너 생성 후 약간의 처리 시간이 필요할 수 있음

PUBLISH_RESPONSE=$(curl -s -X POST "https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads_publish" \
  --data-urlencode "creation_id=${CREATION_ID}" \
  --data-urlencode "access_token=${THREADS_ACCESS_TOKEN}")

POST_ID=$(echo "$PUBLISH_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$POST_ID" ]; then
  echo "에러: 게시 실패"
  echo "$PUBLISH_RESPONSE"
  exit 1
fi

echo "게시 완료! Post ID: $POST_ID"
