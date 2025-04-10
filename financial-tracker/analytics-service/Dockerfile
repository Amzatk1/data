FROM python:3.12

WORKDIR /app

# Set default database URL
ENV DATABASE_URL=postgresql://user:password@analytics-db:5432/analytics_db

# Copy requirements.txt from root and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all service files from the app directory
COPY ./analytics-service/app /app

# Expose the service port
EXPOSE 5004

CMD ["python", "app.py"]
