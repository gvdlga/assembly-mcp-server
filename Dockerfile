FROM node:18-alpine

WORKDIR /assembly-mcp-server

# Copy package files
COPY package*.json ./

# Copy compiler options
COPY tsconfig.json ./

# Copy source code
COPY ./src ./src

# Build TypeScript to JavaScript
RUN npm install

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3005

# Run the server
CMD ["node", "dist/index.js"]