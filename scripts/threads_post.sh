#!/usr/bin/env bash
# 스레드(Threads) 자동 포스팅 스크립트
#
# Windows/Git Bash에서 한글을 커맨드라인 인자로 바로 넘기면 인코딩이 깨질 수 있어서,
# 반드시 UTF-8로 저장된 텍스트 파일을 통해 내용을 전달합니다.
#
# 사용법:
#   ./scripts/threads_post.sh --file 경로/텍스트.txt              → 기본은 dry-run (실제로 안 올라감, 미리보기만)
#   ./scripts/threads_post.sh --file 경로/텍스트.txt --live        → 실제로 스레드에 게시
#
# .env 파일에 THREADS_ACCESS_TOKEN, THREADS_USER_ID가 있어야 합니다.

set -euo pipefail
cd "$(dirname "$0")/.."
export LC_ALL=C.UTF-8 2>/dev/null || export LC_ALL=en_US.UTF-8 2>/dev/null || true

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

if [ "${1:-}" != "--file" ] || [ -z "${2:-}" ]; then
  echo "사용법: $0 --file 경로/텍스트.txt [--live]"
  exit 1
fi

TEXT_FILE="$2"
MODE="${3:-}"

if [ ! -f "$TEXT_FILE" ]; then
  echo "에러: 파일을 찾을 수 없습니다: $TEXT_FILE"
  exit 1
fi

# 중요: 이 텍스트를 bash 변수에 담았다가 curl 인자로 넘기면 Git Bash 환경에서
# 멀티바이트(한글) 문자가 깨지는 버그가 있음 (실측 확인됨). 그래서 항상
# "파일 -> curl --data-urlencode name@file" 방식으로 curl이 파일을 직접 읽게 한다.
# CRLF만 제거한 임시 파일을 만들어서 그 파일을 curl에 직접 전달한다.
# mktemp의 /tmp 경로는 Windows용 curl.exe가 못 읽는 경우가 있어서,
# 프로젝트 폴더 안(상대경로로 접근 가능한 곳)에 임시 파일을 만든다.
CLEAN_FILE="scripts/.tmp_post_content_$$.txt"
tr -d '\r' < "$TEXT_FILE" > "$CLEAN_FILE"
trap 'rm -f "$CLEAN_FILE"' EXIT

if [ "$MODE" != "--live" ]; then
  echo "=== DRY RUN (실제로 게시되지 않습니다) ==="
  echo "게시될 내용:"
  echo "---"
  cat "$CLEAN_FILE"
  echo "---"
  echo "실제로 올리려면 마지막 인자에 --live 를 추가하세요."
  exit 0
fi

echo "1단계: 게시물 컨테이너 생성 중..."
CREATE_RESPONSE=$(curl -s -X POST "https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads" \
  --data-urlencode "media_type=TEXT" \
  --data-urlencode "text@${CLEAN_FILE}" \
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
