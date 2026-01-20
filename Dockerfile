# Build Stage
FROM node:20-alpine as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Ensure env vars are baked in at build time (Vite uses them during build)
# Note: In real CI, these should be passed as ARG.
# Here we rely on the .env file being present or passed args.
ARG VITE_AUTH_API_URL
ARG VITE_CORE_API_URL
ARG VITE_AUTH_BASE_URL

RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
