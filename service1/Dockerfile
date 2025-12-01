FROM oven/bun:canary-debian

WORKDIR /service

ENV REDIS_URL='redis://redis:6379'
ENV INTERVAL_FETCH=300000

COPY package*.json ./

RUN bun install

COPY . .

EXPOSE 3000

ENTRYPOINT ["bun", "run", "src/index.ts"]