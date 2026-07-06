# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    libmagic-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Final minimal runtime
FROM python:3.11-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed dependencies from builder stage
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy project files
COPY . .

# Setup non-root user
RUN groupadd -g 10001 yowon && \
    useradd -u 10001 -g yowon -d /home/yowon -m -s /bin/bash yowon && \
    chown -R yowon:yowon /app

# Ensure directories for persistence can be written to by yowon user
RUN mkdir -p /app/uploads /app/reports /app/repository_cache /app/database && \
    chown -R yowon:yowon /app/uploads /app/reports /app/repository_cache /app/database

USER yowon

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

ENTRYPOINT ["/bin/bash", "/app/docker-entrypoint.sh"]
