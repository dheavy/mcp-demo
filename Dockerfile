# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Install libc6-compat for better compatibility with native modules
RUN apk add --no-cache libc6-compat || echo "libc6-compat not available, continuing without it"

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application in production mode
CMD ["node", "server.js"]
