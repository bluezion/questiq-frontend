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

RUN echo ">>> REACT_APP_API_URL = ${REACT_APP_API_URL}" && \
    npm run build

# Stage 2: Serve
FROM node:18-alpine AS runner

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

# Railway는 PORT 환경변수를 동적으로 할당함
# ${PORT:-3000} → PORT가 없으면 3000 사용
EXPOSE ${PORT:-3000}

CMD ["sh", "-c", "serve -s build -l ${PORT:-3000}"]
