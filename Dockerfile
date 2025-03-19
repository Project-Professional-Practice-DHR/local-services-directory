# Use Node.js LTS as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install PostgreSQL client (for database backups)
RUN apk add --no-cache postgresql-client

# Install application dependencies
# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directories for logs, uploads, and backups with appropriate permissions
RUN mkdir -p logs uploads backups && \
    chmod -R 755 logs uploads backups

# Expose the application port
EXPOSE 5001

# Set environment variables
ENV NODE_ENV=production \
    PORT=5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5001/health || exit 1

# Start the application
CMD ["node", "server.js"]