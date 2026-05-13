# --- Stage 1: Build the React Frontend ---
# This stage uses Node to turn your React code into static files
FROM node:20-alpine AS build-stage
WORKDIR /app/frontend

# Copy package files first to leverage Docker caching
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend files
COPY frontend/ ./

# Vite builds the 'dist' folder here
RUN npm run build

# --- Stage 2: Setup the Python Backend ---
# This stage is what actually runs on your server
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your backend code (main.py, db folder, etc.)
COPY . .

# IMPORTANT: Copy the 'dist' folder from the build-stage
# This places your compiled React app into the folder your backend expects
COPY --from=build-stage /app/frontend/dist ./frontend/dist

# Use the PORT variable from your .env file
# If PORT is not set, it defaults to 3001 as per your request
ENV PORT=3001

# Command to start your application
# Ensure main.py is set up to listen on port 3001
CMD ["python", "main.py"]