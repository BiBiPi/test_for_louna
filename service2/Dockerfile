FROM oven/bun:canary-debian

WORKDIR /service

ENV PG_URL='pg'
ENV PG_PORT=5432

COPY package*.json ./

RUN bun install

COPY . .

EXPOSE 3000

ENTRYPOINT ["bun", "run", "src/index.ts"]