FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app

RUN npm install -g pnpm@9

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/

RUN pnpm install --frozen-lockfile

COPY packages/types/src packages/types/src/
COPY apps/server/ apps/server/

WORKDIR /app/apps/server
RUN pnpm exec prisma generate && pnpm exec nest build

FROM node:20-alpine AS production
RUN apk add --no-cache openssl
WORKDIR /app

RUN npm install -g pnpm@9

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY packages/types/package.json packages/types/

RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/apps/server/dist apps/server/dist/
COPY --from=build /app/apps/server/prisma apps/server/prisma/
COPY apps/server/docker-entrypoint.sh apps/server/

RUN chmod +x apps/server/docker-entrypoint.sh

WORKDIR /app/apps/server
RUN pnpm exec prisma generate

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
