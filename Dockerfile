# Multi-stage build for Google Cloud Run
FROM node:20-slim AS base

# Install Python 3.11 for Hyperliquid SDK
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Hyperliquid Python SDK (use --break-system-packages for Docker)
RUN pip3 install --no-cache-dir --break-system-packages hyperliquid-python-sdk

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy patches directory (required by pnpm)
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-slim

# Install Python runtime
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Hyperliquid SDK in production (use --break-system-packages for Docker)
RUN pip3 install --no-cache-dir --break-system-packages hyperliquid-python-sdk

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built application from base stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/server ./server
COPY --from=base /app/drizzle ./drizzle

# Cloud Run expects PORT environment variable
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/system/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["pnpm", "start"]
