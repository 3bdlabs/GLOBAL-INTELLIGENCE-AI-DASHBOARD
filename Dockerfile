FROM node:22-alpine

# Use an unprivileged user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./

# Copy scripts package files
COPY scripts/package.json scripts/package-lock.json* ./scripts/

# Copy blog-site package files
COPY blog-site/package.json blog-site/package-lock.json* ./blog-site/

RUN npm ci

# Copy application files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start the dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
