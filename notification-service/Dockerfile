FROM node:18-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY package*.json ./
RUN npm install --omit=dev
COPY src/ ./src/
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"
CMD ["node", "src/index.js"]
