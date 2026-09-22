# ============================================================
# STAGE 1 — BUILD REACT APPLICATION
# ============================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first
# This allows Docker to cache npm installation.
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the complete frontend source
COPY . .

# Build React/Vite application
RUN npm run build


# ============================================================
# STAGE 2 — SERVE WITH NGINX
# ============================================================

FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy Vite production build
COPY --from=builder /app/dist /usr/share/nginx/html

# React Router support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx listens on port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]