FROM ghcr.io/puppeteer/puppeteer:21.5.2

# Build as root
USER root
WORKDIR /home/pptruser/app

# Ensure a stable Puppeteer cache location (writable at runtime)
ENV HOME=/home/pptruser
ENV PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer
RUN mkdir -p ${PUPPETEER_CACHE_DIR} && chown -R pptruser:pptruser ${PUPPETEER_CACHE_DIR} /home/pptruser/app

# Copy manifests first for better caching
COPY package*.json ./

# Skip Chromium during npm install (we'll install CfT explicitly)
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci --omit=dev

# Install Chrome for Testing once at build time
RUN npx puppeteer browsers install chrome

# Copy app source
COPY . .
RUN chown -R pptruser:pptruser /home/pptruser/app

# Optional: point explicitly to Chrome for Testing binary
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Runtime env
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Run as non-root (Cloud Run friendly)
USER pptruser

CMD ["npm","start"]
