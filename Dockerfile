FROM ghcr.io/puppeteer/puppeteer:21.5.2

# Install as root, then run as pptruser
USER root
RUN mkdir -p /home/pptruser/app && chown -R pptruser:pptruser /home/pptruser/app
WORKDIR /home/pptruser/app

# Copy manifests first (better cache)
COPY package*.json ./

# IMPORTANT: Do NOT download Chrome in build (base image already has it)
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Install deps (omit dev to keep image small)
RUN npm ci --omit=dev

# Copy the rest
COPY . .
RUN chown -R pptruser:pptruser /home/pptruser/app
USER pptruser

# Ensure Puppeteer uses the Chrome in the image
ENV NODE_ENV=production
ENV PORT=8080
ENV HEADLESS=true
ENV PUPPETEER_DISABLE_HEADLESS_WARNING=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
ENV CHROME_PATH=/usr/bin/google-chrome

EXPOSE 8080
CMD ["npm","start"]
