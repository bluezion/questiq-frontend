# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# package.json만 먼저 복사하여 레이어 캐시 활용
COPY package.json ./

# 의존성 설치
RUN npm install --legacy-peer-deps

# 설치된 핵심 패키지 버전 확인 (디버깅용)
RUN echo "=== 핵심 패키지 버전 ===" && \
    echo "ajv:" && npm list ajv --depth=0 2>/dev/null | head -5 && \
    echo "ajv-keywords:" && npm list ajv-keywords --depth=0 2>/dev/null | head -5 && \
    echo "schema-utils top-level:" && npm list schema-utils --depth=0 2>/dev/null | head -5 && \
    echo "=== ForkTsChecker는 config-overrides.js로 비활성화 ==="

# 소스 코드 복사
COPY . .

# 빌드 환경 변수
ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV NODE_OPTIONS=--max-old-space-size=4096

# 빌드 실행 (react-app-rewired 사용)
RUN npm run build

# Stage 2: Serve
FROM node:18-alpine AS runner

WORKDIR /app

# serve 전역 설치
RUN npm install -g serve

# 빌드 결과물 복사
COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
