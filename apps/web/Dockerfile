FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY --from=build /app/.output ./.output
EXPOSE 3001
CMD ["node", ".output/server/index.mjs"]
