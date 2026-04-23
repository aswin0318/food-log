# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Run
FROM node:20-alpine
RUN addgroup -g 1001 -S appuser && adduser -S -u 1001 -G appuser appuser
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 3000
ENV NODE_ENV=production PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
