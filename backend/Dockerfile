FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install packages
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose port
EXPOSE 5000

# Set environment variable
ENV NODE_ENV=production
ENV PORT=5000

# Start the application
CMD ["npm", "start"]
