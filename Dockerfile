# Stage 1: Build
# Node 16 = npm v8 (react-scripts 5.0.1 공식 지원 버전)
FROM node:16-alpine AS builder

WORKDIR /app

# package.json만 복사 (package-lock.json 제외 → fresh install)
COPY package.json ./

# 의존성 설치
RUN npm install --legacy-peer-deps

# ── ajv 충돌 수동 교정 ────────────────────────────────────────────────
# fork-ts-checker-webpack-plugin 의 중첩된 schema-utils 가
# 최상위 ajv-keywords v5 를 잘못 참조하는 문제를 직접 해결
RUN FTC_DIR=/app/node_modules/fork-ts-checker-webpack-plugin && \
    if [ -d "$FTC_DIR/node_modules/schema-utils" ]; then \
      echo "🔧 Patching fork-ts-checker nested schema-utils..." && \
      mkdir -p $FTC_DIR/node_modules/ajv-keywords && \
      cd /tmp && npm pack ajv-keywords@3.5.2 --quiet && \
      tar xf ajv-keywords-3.5.2.tgz -C /tmp && \
      cp -r /tmp/package/* $FTC_DIR/node_modules/ajv-keywords/ && \
      mkdir -p $FTC_DIR/node_modules/ajv && \
      cd /tmp && npm pack ajv@6.12.6 --quiet && \
      tar xf ajv-6.12.6.tgz -C /tmp/ajv-pkg --one-top-level=ajv-pkg && \
      cp -r /tmp/ajv-pkg/ajv-pkg/* $FTC_DIR/node_modules/ajv/ && \
      echo "✅ Patch applied" || \
      echo "⚠️ No nested schema-utils found, skipping patch"; \
    fi

# 소스 복사
COPY . .

# 빌드 환경 변수
ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 빌드 실행
RUN npm run build

# Stage 2: Serve
FROM node:16-alpine AS runner

RUN npm install -g serve

WORKDIR /app
COPY --from=builder /app/build ./build

EXPOSE 3000

CMD serve -s build -l ${PORT:-3000}
