# syntax=docker/dockerfile:1
# Build from monorepo root:
#   docker build -f app/Dockerfile -t mcfly-app .

FROM node:22-alpine AS deps
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY app/package.json ./app/
RUN npm ci --omit=dev || npm install --omit=dev

FROM node:22-alpine AS build
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY app ./app
WORKDIR /repo/app
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
COPY --from=build /repo/app /app
COPY --from=build /repo/node_modules /app/node_modules
COPY --from=build /repo/packages /packages
CMD ["npm", "run", "docker-start"]
