# Use Node.js as base image
FROM node:20

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Set proper permissions for node_modules/
# RUN chmod -R 755 /app/node_modules/

# Copy all frontend code
COPY . .

# Set API Gateway URL for the frontend
ENV REACT_APP_API_URL=http://api-gateway:8000

# Expose frontend port
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]
