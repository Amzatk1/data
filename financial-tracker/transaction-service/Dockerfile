FROM python:3.12

WORKDIR /app

# Set default database URL
ENV DATABASE_URL=postgresql://user:password@transaction-db:5432/transaction_db

# Copy requirements.txt from root and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the current service's code
COPY ./transaction-service/app /app

# Expose the service port
EXPOSE 5002

CMD ["python", "app.py"]
