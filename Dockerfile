FROM node:20-slim

# Install Chromium and standard system fonts for Puppeteer rendering
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the installed Chromium executable and skip download during npm ci
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PORT=3000

WORKDIR /app

# Copy dependency manifests first for build caching
COPY package*.json ./

# Clean production-only install
RUN npm ci --omit=dev

# Copy remaining source code
COPY . .

# Expose the web server port
EXPOSE 3000

# Start Express server
CMD ["npm", "start"]
