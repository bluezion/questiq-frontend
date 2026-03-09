# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./

RUN npm install --legacy-peer-deps

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
