# React 18 + TypeScript 빌드용 Dockerfile
# Nixpacks 대신 직접 제어

FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 먼저 복사 (레이어 캐시 활용)
COPY package.json ./

# 클린 설치 (package-lock 없이 새로 resolve)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# 소스 복사
COPY . .

# 빌드
ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

# 서빙 스테이지
FROM node:18-alpine AS runner

WORKDIR /app

RUN npm install -g serve --no-audit --no-fund

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD serve -s build -l ${PORT:-3000}
