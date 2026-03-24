FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_NOCODB_BASE_URL
ARG VITE_NOCODB_API_KEY

ENV VITE_NOCODB_BASE_URL=$VITE_NOCODB_BASE_URL
ENV VITE_NOCODB_API_KEY=$VITE_NOCODB_API_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
