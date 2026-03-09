# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# ─────────────────────────────────────────────────────────────────
# Railway Variables → Docker build ARG 주입
# Railway는 Dockerfile에 ARG로 선언된 변수를 빌드 시점에 자동 전달함
# CRA(react-scripts)는 빌드 시점에 REACT_APP_* 변수를 번들에 포함시킴
# ─────────────────────────────────────────────────────────────────
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .

ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV NODE_OPTIONS=--max-old-space-size=4096

# 빌드 시 REACT_APP_API_URL 값 확인 (Railway 빌드 로그에서 확인 가능)
RUN echo ">>> [BUILD] REACT_APP_API_URL = ${REACT_APP_API_URL}" && \
    npm run build

# Stage 2: Serve
FROM node:18-alpine AS runner

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

# 런타임 엔트리포인트 복사 (컨테이너 시작 시 env-config.js 동적 생성)
COPY serve-entrypoint.sh ./serve-entrypoint.sh
RUN chmod +x ./serve-entrypoint.sh

EXPOSE 3000

# ─────────────────────────────────────────────────────────────────
# 엔트리포인트를 통해 시작:
#   1) 런타임 REACT_APP_API_URL → build/env-config.js 에 주입
#   2) serve -s build -l 3000 실행
# 덕분에 Railway Variables 에서 REACT_APP_API_URL 을 바꾸고
# 재시작(redeploy)만 해도 적용됩니다 (재빌드 불필요).
# ─────────────────────────────────────────────────────────────────
CMD ["sh", "./serve-entrypoint.sh"]
