# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./

# npm install + fork-ts-checker 패치를 한 레이어에서 처리 (캐시 문제 방지)
# 패치: fork-ts-checker 디렉토리 안에서 직접 npm install 실행
# → node_modules 해석 우선순위로 최상위 ajv-keywords@5 대신 로컬 v3를 찾게 됨
RUN npm install --legacy-peer-deps && \
    echo "[PATCH] Installing ajv@6 + ajv-keywords@3 inside fork-ts-checker..." && \
    cd /app/node_modules/fork-ts-checker-webpack-plugin && \
    npm install --no-save --legacy-peer-deps ajv@6.12.6 ajv-keywords@3.5.2 && \
    echo "[PATCH] Done. Installed:" && \
    ls /app/node_modules/fork-ts-checker-webpack-plugin/node_modules/ && \
    cd /app

COPY . .

ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN npm run build

# Stage 2: Serve
FROM node:18-alpine AS runner

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
