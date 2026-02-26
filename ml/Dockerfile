# ---- Base image with Node + Python ----
FROM node:20-bookworm

# Install Python + pip
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# Set working dir
WORKDIR /app

# Copy package files first (better caching)
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install Node deps
RUN npm ci

# Copy the rest of the app
COPY . .

# Install Python deps for ML
RUN python3 -m pip install --no-cache-dir -r ml/requirements.txt

# Build Next.js
RUN npm run build

# Railway provides PORT; Next listens on it
ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
