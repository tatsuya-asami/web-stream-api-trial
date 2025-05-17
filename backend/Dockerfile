FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm dlx prisma generate
RUN pnpm run build

EXPOSE 3000
CMD ["pnpm", "run", "start:prod"]