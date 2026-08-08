FROM python:3.10

WORKDIR /app

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and model weights
COPY . .

# Expose FastAPI default port
EXPOSE 8000

# Run with uvicorn, reading PORT from environment (fallback to 8000)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
