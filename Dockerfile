# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# package.json만 먼저 복사 (레이어 캐시 활용)
COPY package.json ./

# 의존성 설치
RUN npm install --legacy-peer-deps

# ────────────────────────────────────────────────────────────────────────────
# 핵심 패치: fork-ts-checker-webpack-plugin 의 전이 의존성 교체
#
# 문제 경로:
#   fork-ts-checker-webpack-plugin
#     └── node_modules/schema-utils (v3)
#           └── require('ajv-keywords')  ← 최상위 v5를 찾음 → formatMinimum 없음
#
# 해결: fork-ts-checker/node_modules/ 에 ajv@6 + ajv-keywords@3 를 물리 주입하면
#       Node.js 모듈 해석 우선순위에 의해 최상위 v8/v5 보다 먼저 발견됨.
# ────────────────────────────────────────────────────────────────────────────
RUN set -e && \
    echo ">>> [PATCH] fork-ts-checker-webpack-plugin 의존성 패치 시작" && \
    # 패치용 임시 디렉토리에서 호환 버전 설치
    mkdir -p /tmp/fts-patch && \
    cd /tmp/fts-patch && \
    npm init -y && \
    npm install --no-save --legacy-peer-deps \
        ajv@6.12.6 \
        ajv-keywords@3.5.2 \
        ajv-errors@1.0.1 && \
    # fork-ts-checker 전용 node_modules 생성
    FTSC_DIR=/app/node_modules/fork-ts-checker-webpack-plugin/node_modules && \
    mkdir -p "$FTSC_DIR" && \
    # 패치 복사 (ajv@6, ajv-keywords@3, ajv-errors@1)
    cp -rp /tmp/fts-patch/node_modules/ajv              "$FTSC_DIR/" && \
    cp -rp /tmp/fts-patch/node_modules/ajv-keywords     "$FTSC_DIR/" && \
    cp -rp /tmp/fts-patch/node_modules/ajv-errors       "$FTSC_DIR/" && \
    # 정리
    rm -rf /tmp/fts-patch && \
    echo ">>> [PATCH] 완료: ajv@6 + ajv-keywords@3 주입됨" && \
    # 검증: 경로 확인
    ls "$FTSC_DIR/"

# 소스 코드 복사
COPY . .

# 빌드 환경 변수
ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV NODE_OPTIONS=--max-old-space-size=4096

# 빌드 (react-app-rewired 사용 → ForkTsCheckerWebpackPlugin webpack 설정에서도 제거)
RUN npm run build

# Stage 2: Serve
FROM node:18-alpine AS runner

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
