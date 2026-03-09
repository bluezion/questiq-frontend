#!/bin/sh
# serve-entrypoint.sh
# ─────────────────────────────────────────────────────────────────────────────
# 컨테이너 시작 시 실행되는 엔트리포인트
# 런타임 환경변수(REACT_APP_API_URL 등)를 /app/build/env-config.js 에 주입합니다.
# CRA는 빌드 타임에 번들을 굽지만, 이 방식으로 런타임에도 값을 전달할 수 있습니다.
# ─────────────────────────────────────────────────────────────────────────────
set -e

API_URL="${REACT_APP_API_URL:-}"

echo "[entrypoint] REACT_APP_API_URL = ${API_URL}"

# env-config.js 동적 생성 → window._env_ 에 런타임 값 주입
cat > /app/build/env-config.js <<EOF
// 자동 생성된 파일 — 수동으로 수정하지 마세요
window._env_ = {
  REACT_APP_API_URL: "${API_URL}"
};
EOF

echo "[entrypoint] env-config.js 생성 완료"
echo "[entrypoint] serve -s build -l 3000 시작..."

exec serve -s build -l 3000
