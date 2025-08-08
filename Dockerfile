FROM ghcr.io/puppeteer/puppeteer:latest
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PORT=8080

EXPOSE 8080
CMD ["npm","start"]
