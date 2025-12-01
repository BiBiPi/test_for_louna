FROM oven/bun:canary-debian

WORKDIR /service

ENV PG_URL='postgres://root:root@pg:5432/test'

COPY package*.json ./

RUN bun install

COPY . .

EXPOSE 3000

ENTRYPOINT ["bun", "run", "src/index.ts"]