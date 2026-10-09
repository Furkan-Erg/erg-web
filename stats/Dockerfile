# syntax=docker/dockerfile:1

FROM node:22-alpine
WORKDIR /app
COPY server.mjs ./
RUN mkdir /data && chown node:node /data
USER node
ENV DATA_DIR=/data
EXPOSE 8080
CMD ["node", "server.mjs"]
