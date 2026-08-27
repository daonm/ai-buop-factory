#!/usr/bin/env bash
# 스레드(Threads) 게시물에 답글(댓글)을 자동으로 다는 스크립트
#
# 사용법:
#   ./scripts/threads_reply.sh --to <원글_POST_ID> --file 경로/텍스트.txt              → 기본은 dry-run (실제로 안 달림, 미리보기만)
#   ./scripts/threads_reply.sh --to <원글_POST_ID> --file 경로/텍스트.txt --live        → 실제로 답글 게시
#
# .env 파일에 THREADS_ACCESS_TOKEN, THREADS_USER_ID가 있어야 합니다.
# threads_post.sh와 동일한 원리(파일 -> curl --data-urlencode name@file)로 한글 깨짐을 방지합니다.
# 원글에 대한 답글은 media_type=TEXT + reply_to_id=<원글 ID> 파라미터만 추가하면 됩니다.

set -euo pipefail
cd "$(dirname "$0")/.."
export LC_ALL=C.UTF-8 2>/dev/null || export LC_ALL=en_US.UTF-8 2>/dev/null || true

if [ ! -f .env ]; then
  echo "에러: .env 파일이 없습니다. THREADS_ACCESS_TOKEN, THREADS_USER_ID를 먼저 설정하세요."
  exit 1
fi

set -a
source <(tr -d '\r' < .env)
set +a

if [ -z "${THREADS_ACCESS_TOKEN:-}" ] || [ -z "${THREADS_USER_ID:-}" ]; then
  echo "에러: THREADS_ACCESS_TOKEN 또는 THREADS_USER_ID가 .env에 비어있습니다."
  exit 1
fi

REPLY_TO=""
TEXT_FILE=""
MODE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --to) REPLY_TO="$2"; shift 2 ;;
    --file) TEXT_FILE="$2"; shift 2 ;;
    --live) MODE="--live"; shift ;;
    *) echo "알 수 없는 옵션: $1"; exit 1 ;;
  esac
done

if [ -z "$REPLY_TO" ] || [ -z "$TEXT_FILE" ]; then
  echo "사용법: $0 --to <원글_POST_ID> --file 경로/텍스트.txt [--live]"
  exit 1
fi

if [ ! -f "$TEXT_FILE" ]; then
  echo "에러: 파일을 찾을 수 없습니다: $TEXT_FILE"
  exit 1
fi

CLEAN_FILE="scripts/.tmp_reply_content_$$.txt"
tr -d '\r' < "$TEXT_FILE" > "$CLEAN_FILE"
trap 'rm -f "$CLEAN_FILE"' EXIT

if [ "$MODE" != "--live" ]; then
  echo "=== DRY RUN (실제로 게시되지 않습니다) ==="
  echo "답글 달릴 원글 ID: $REPLY_TO"
  echo "게시될 답글 내용:"
  echo "---"
  cat "$CLEAN_FILE"
  echo "---"
  echo "실제로 올리려면 마지막 인자에 --live 를 추가하세요."
  exit 0
fi

echo "1단계: 답글 컨테이너 생성 중..."
CREATE_RESPONSE=$(curl -s -X POST "https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads" \
  --data-urlencode "media_type=TEXT" \
  --data-urlencode "text@${CLEAN_FILE}" \
  --data-urlencode "reply_to_id=${REPLY_TO}" \
  --data-urlencode "access_token=${THREADS_ACCESS_TOKEN}")

CREATION_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CREATION_ID" ]; then
  echo "에러: 답글 컨테이너 생성 실패"
  echo "$CREATE_RESPONSE"
  exit 1
fi

echo "컨테이너 생성됨: $CREATION_ID"
echo "2단계: 답글 게시 중..."

sleep 2

PUBLISH_RESPONSE=$(curl -s -X POST "https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads_publish" \
  --data-urlencode "creation_id=${CREATION_ID}" \
  --data-urlencode "access_token=${THREADS_ACCESS_TOKEN}")

REPLY_ID=$(echo "$PUBLISH_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$REPLY_ID" ]; then
  echo "에러: 답글 게시 실패"
  echo "$PUBLISH_RESPONSE"
  exit 1
fi

echo "답글 게시 완료! Reply ID: $REPLY_ID"
