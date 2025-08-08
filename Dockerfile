FROM ghcr.io/puppeteer/puppeteer:21.5.2

# Install as root, then run as pptruser
USER root
RUN mkdir -p /home/pptruser/app && chown -R pptruser:pptruser /home/pptruser/app
WORKDIR /home/pptruser/app

# Copy manifests first (better cache)
COPY package*.json ./

# IMPORTANT: Skip Chromium download BEFORE install (base image has Chrome)
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Install deps (omit dev to keep image small)
RUN npm ci --omit=dev

# Copy the rest
COPY . .
RUN chown -R pptruser:pptruser /home/pptruser/app
USER pptruser

# Optional: if your code uses executablePath explicitly
# ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["npm","start"]
