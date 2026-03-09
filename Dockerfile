# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# package.json만 먼저 복사 (package-lock.json 제외 - fresh install)
COPY package.json ./

# nested overrides가 적용된 fresh install
RUN npm install --legacy-peer-deps

# 소스 파일 복사
COPY . .

# 빌드 환경변수
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
