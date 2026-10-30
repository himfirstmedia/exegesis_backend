FROM node:22-alpine

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

# Start through `npm start` so the container applies `prisma migrate deploy`
# before serving. Running `node src/server.js` directly booted against whatever
# schema happened to exist and skipped every pending migration.
CMD ["npm", "start"]

# Railway's healthcheck uses /health, which now verifies the database. The
# container-level check keeps `docker run` from reporting healthy on a dead DB.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
