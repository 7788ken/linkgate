# Gateway Dockerfile

FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY packages/gateway/package.json ./packages/gateway/

# Install dependencies
RUN pnpm install

# Copy source code
COPY tsconfig.json ./
COPY packages/gateway ./packages/gateway

# Build
WORKDIR /app/packages/gateway
RUN pnpm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built files
COPY --from=builder /app/packages/gateway/dist ./dist
COPY --from=builder /app/packages/gateway/package.json ./
COPY --from=builder /app/packages/gateway/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
