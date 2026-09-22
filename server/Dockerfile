# Use Node.js 22
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the server source code
COPY . .

# Server runs on port 5000
EXPOSE 5000

# Start Express server
CMD ["node", "server.js"]