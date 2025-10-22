# Production image for LogiFin Backend
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including tsx for running TypeScript)
RUN npm ci && \
    npm cache clean --force

# Copy TypeScript configuration
COPY --chown=nodejs:nodejs tsconfig*.json ./
COPY --chown=nodejs:nodejs server/tsconfig.json ./server/

# Copy application source files
COPY --chown=nodejs:nodejs server ./server
COPY --chown=nodejs:nodejs scripts ./scripts
COPY --chown=nodejs:nodejs src ./src

# Copy startup script
COPY --chown=nodejs:nodejs start.sh ./
RUN chmod +x start.sh

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["./start.sh"]
