FROM python:3.12

WORKDIR /app

# Set default database URL
ENV DATABASE_URL=postgresql://user:password@notification-db:5432/notification_db

# Copy requirements.txt from root and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the current service's code
COPY ./notification-service/app /app

# Expose the service port
EXPOSE 5005

CMD ["python", "app.py"]
