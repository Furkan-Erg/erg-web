# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app
COPY build.mjs ./
COPY src ./src
COPY public ./public
RUN node build.mjs

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN nginx -t
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
