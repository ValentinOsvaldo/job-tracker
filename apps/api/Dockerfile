# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.21.1
FROM node:${NODE_VERSION}-slim AS base


WORKDIR /app

ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

COPY package.json ./
RUN npm install --include=dev

COPY . .

RUN npm run build


# Final stage for app image
FROM base

COPY --from=build /app /app

EXPOSE 3000
# Migrations run on boot (migrationsRun when NODE_ENV=production)
CMD [ "node", "dist/main" ]
