FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/public/dist ./public/dist
COPY server.js .
COPY public/index.html public/styles.css public/favicon.svg ./public/
COPY public/audio ./public/audio
COPY public/js ./public/js
EXPOSE 3000
VOLUME /app/data
USER node
CMD ["node", "server.js"]
