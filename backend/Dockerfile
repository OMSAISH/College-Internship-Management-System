FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for build tools and PostgreSQL clients
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend code
COPY backend /app/backend

# Create uploads directory
RUN mkdir -p /app/uploads

ENV PYTHONPATH=/app
ENV PORT=8000

EXPOSE 8000

# Start server with uvicorn
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
