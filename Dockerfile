FROM ghcr.io/puppeteer/puppeteer:latest
# Tip: you can pin to your app's Puppeteer version:
# FROM ghcr.io/puppeteer/puppeteer:21.5.2

# Install as root, then hand ownership to pptruser
USER root
RUN mkdir -p /home/pptruser/app && chown -R pptruser:pptruser /home/pptruser/app
WORKDIR /home/pptruser/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN chown -R pptruser:pptruser /home/pptruser/app
USER pptruser

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PORT=8080

EXPOSE 8080
CMD ["npm","start"]
