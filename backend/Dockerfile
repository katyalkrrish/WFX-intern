FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create a non-root user required by HF Spaces
RUN useradd -m -u 1000 user

# Copy files and set permissions BEFORE switching user
COPY --chown=user:user . .

USER user

ENV PORT=7860
EXPOSE 7860

CMD ["python", "-m", "app.main"]
