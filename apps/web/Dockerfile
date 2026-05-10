FROM node:20-alpine AS build
WORKDIR /app

RUN npm install -g pnpm@9

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/

RUN pnpm install --frozen-lockfile

COPY packages/types/src packages/types/src/
COPY apps/web/ apps/web/

WORKDIR /app/apps/web
RUN pnpm exec tsc -b && pnpm exec vite build

FROM nginx:alpine AS production
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
