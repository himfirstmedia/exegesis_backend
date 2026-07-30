#!/usr/bin/env bash
set -e

MODEL="${LLM_MODEL:-llama3.2:3b}"

if ! ollama list 2>/dev/null | grep -q "$MODEL"; then
  echo "Pulling $MODEL (first run)…"
  ollama pull "$MODEL"
fi

echo "Starting Ollama server for $MODEL …"
ollama serve &

for i in $(seq 1 30); do
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama ready"
    break
  fi
  sleep 1
done

wait
