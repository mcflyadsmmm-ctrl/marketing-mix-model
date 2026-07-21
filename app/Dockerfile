# syntax=docker/dockerfile:1
# Build from monorepo root:
#   docker build -f app/Dockerfile -t mcfly-app .

FROM node:22-alpine AS build
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY app/package.json ./app/
COPY packages ./packages
# Install ALL deps (need typescript to compile packages)
RUN npm install
COPY app ./app
RUN npm run build --workspace=@mcfly/mer-core \
 && npm run build --workspace=@mcfly/mer-engine \
 && cd app \
 && npx prisma generate \
 && npm run build

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
COPY --from=build /repo/package.json /repo/package-lock.json* ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/app ./app
WORKDIR /repo/app
CMD ["npm", "run", "docker-start"]
