#!/usr/bin/env bash
# 스레드(Threads)에 이미지 포함 게시물을 올리는 스크립트
#
# 사용법:
#   ./scripts/threads_image_post.sh --file 캡션.txt --image-url <공개_이미지_URL>              → dry-run
#   ./scripts/threads_image_post.sh --file 캡션.txt --image-url <공개_이미지_URL> --live        → 실제 게시
#
# Threads API는 이미지를 직접 업로드하는 게 아니라, 공개적으로 접근 가능한 이미지 URL을 요구합니다.
# (로컬 파일은 먼저 GitHub 저장소 등에 올려서 raw URL을 만든 뒤 그 URL을 넘겨야 함)
#
# .env 파일에 THREADS_ACCESS_TOKEN, THREADS_USER_ID가 있어야 합니다.

set -euo pipefail
cd "$(dirname "$0")/.."
export LC_ALL=C.UTF-8 2>/dev/null || export LC_ALL=en_US.UTF-8 2>/dev/null || true

if [ ! -f .env ]; then
  echo "에러: .env 파일이 없습니다."
  exit 1
fi

set -a
source <(tr -d '\r' < .env)
set +a

if [ -z "${THREADS_ACCESS_TOKEN:-}" ] || [ -z "${THREADS_USER_ID:-}" ]; then
  echo "에러: THREADS_ACCESS_TOKEN 또는 THREADS_USER_ID가 .env에 비어있습니다."
  exit 1
fi

TEXT_FILE=""
IMAGE_URL=""
MODE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --file) TEXT_FILE="$2"; shift 2 ;;
    --image-url) IMAGE_URL="$2"; shift 2 ;;
    --live) MODE="--live"; shift ;;
    *) echo "알 수 없는 옵션: $1"; exit 1 ;;
  esac
done

if [ -z "$TEXT_FILE" ] || [ -z "$IMAGE_URL" ]; then
  echo "사용법: $0 --file 캡션.txt --image-url <공개_이미지_URL> [--live]"
  exit 1
fi

if [ ! -f "$TEXT_FILE" ]; then
  echo "에러: 파일을 찾을 수 없습니다: $TEXT_FILE"
  exit 1
fi

CLEAN_FILE="scripts/.tmp_image_post_content_$$.txt"
tr -d '\r' < "$TEXT_FILE" > "$CLEAN_FILE"
trap 'rm -f "$CLEAN_FILE"' EXIT

if [ "$MODE" != "--live" ]; then
  echo "=== DRY RUN (실제로 게시되지 않습니다) ==="
  echo "이미지 URL: $IMAGE_URL"
  echo "게시될 캡션:"
  echo "---"
  cat "$CLEAN_FILE"
  echo "---"
  echo "실제로 올리려면 마지막 인자에 --live 를 추가하세요."
  exit 0
fi

echo "1단계: 이미지 게시물 컨테이너 생성 중..."
CREATE_RESPONSE=$(curl -s -X POST "https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads" \
  --data-urlencode "media_type=IMAGE" \
  --data-urlencode "image_url=${IMAGE_URL}" \
  --data-urlencode "text@${CLEAN_FILE}" \
  --data-urlencode "access_token=${THREADS_ACCESS_TOKEN}")

CREATION_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CREATION_ID" ]; then
  echo "에러: 컨테이너 생성 실패"
  echo "$CREATE_RESPONSE"
  exit 1
fi

echo "컨테이너 생성됨: $CREATION_ID"
echo "2단계: 이미지 처리 대기 후 게시 중..."

sleep 5

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
