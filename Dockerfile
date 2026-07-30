FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

RUN apk add --no-cache curl && \
    curl -L https://ollama.com/download/Ollama-linux-amd64.tar.gz | tar xz && \
    mv ollama /usr/local/bin/ollama && \
    chmod +x /usr/local/bin/ollama

FROM alpine:3.20
RUN apk add --no-cache curl ca-certificates
COPY --from=builder /usr/local/bin/ollama /usr/local/bin/ollama
COPY --from=builder /app /app
COPY scripts/start-llm.sh /usr/local/bin/start-llm.sh
RUN chmod +x /usr/local/bin/start-llm.sh

WORKDIR /app
EXPOSE 5001
ENV NODE_ENV=production

CMD ["/bin/sh", "-c", "start-llm.sh & node src/server.js"]
