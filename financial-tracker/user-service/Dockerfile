FROM python:3.12

WORKDIR /app

# Set default database URL
ENV DATABASE_URL=postgresql://user:password@user-db:5432/user_db

# Copy requirements.txt from root and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all service files from the app directory
COPY ./user-service/app /app

# Expose the service port
EXPOSE 5001

# Use the environment variable
CMD ["python", "app.py"]
