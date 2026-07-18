#!/bin/bash
set -e

OLLAMA_HOST_URL="http://ollama:11434"

echo "[Ollama-Init] Waiting for Ollama service to start..."
until curl -s "$OLLAMA_HOST_URL/api/tags" > /dev/null; do
  sleep 2
done
echo "[Ollama-Init] Ollama is up and healthy."

# Pull required models
MODELS=("qwen2.5:7b" "nomic-embed-text")

for model in "${MODELS[@]}"; do
  echo "[Ollama-Init] Checking availability of model: $model..."
  if curl -s "$OLLAMA_HOST_URL/api/tags" | grep -q "\"name\":\"$model"; then
    echo "[Ollama-Init] Model $model already exists, skipping download."
  else
    echo "[Ollama-Init] Pulling model: $model (this might take some time depending on your connection)..."
    curl -X POST "$OLLAMA_HOST_URL/api/pull" -d "{\"name\":\"$model\"}"
    echo ""
    echo "[Ollama-Init] Pull complete: $model"
  fi
done

echo "[Ollama-Init] All models pulled and verified successfully!"
