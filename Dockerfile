# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# package.json 복사 (package-lock.json 제외)
COPY package.json ./

# 의존성 설치
RUN npm install --legacy-peer-deps

# ── 실제 설치된 버전 확인 (빌드 로그에서 검증) ──────────────────
RUN echo "=== 설치된 패키지 버전 ===" && \
    echo "ajv: $(node -e "console.log(require('./node_modules/ajv/package.json').version)")" && \
    echo "ajv-keywords: $(node -e "console.log(require('./node_modules/ajv-keywords/package.json').version)")" && \
    echo "schema-utils: $(node -e "console.log(require('./node_modules/schema-utils/package.json').version)")" && \
    echo "fork-ts-checker 내 schema-utils: $(node -e "try{console.log(require('./node_modules/fork-ts-checker-webpack-plugin/node_modules/schema-utils/package.json').version)}catch(e){console.log('없음(정상)')}" 2>/dev/null)" && \
    echo "==========================="

# 소스 파일 복사
COPY . .

# 빌드 환경 변수
ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 빌드
RUN npm run build

# Stage 2: Serve
FROM node:18-alpine AS runner

RUN npm install -g serve

WORKDIR /app
COPY --from=builder /app/build ./build

EXPOSE 3000

CMD serve -s build -l ${PORT:-3000}
