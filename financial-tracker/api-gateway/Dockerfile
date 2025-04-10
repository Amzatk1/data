FROM python:3.12

WORKDIR /app

# Copy requirements.txt from root and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the necessary files
COPY ./api-gateway/app /app

# Expose API Gateway port
EXPOSE 8000

# Run the API Gateway
CMD ["python", "app.py"]
