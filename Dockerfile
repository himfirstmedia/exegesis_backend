FROM node:20-alpine

WORKDIR /app

# Lordsbook returns WAV; preserve the existing app/web MP3 contract.
RUN apk add --no-cache ffmpeg

# Copy Prisma schema + config BEFORE installing deps so the
# `postinstall` script (`prisma generate`) can find the schema.
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

# Install production dependencies (postinstall runs `prisma generate`)
RUN npm ci --omit=dev

# Copy the rest of the application source
COPY . .

EXPOSE 5001
ENV NODE_ENV=production

CMD ["node", "src/server.js"]
