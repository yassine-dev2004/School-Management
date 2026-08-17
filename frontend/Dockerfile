# Stage 1: Build the React app
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Build with the API URL injected at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config for SPA routing
RUN echo 'server { \
    listen 80; \
    listen [::]:80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Railway injects PORT env variable, default to 80
ENV PORT=80
CMD sed -i "s/listen 80/listen ${PORT:-80}/g; s/listen \[::\]:80/listen [::]:${PORT:-80}/g" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'

