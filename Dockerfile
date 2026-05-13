# --- Stage 1: Build the React Frontend ---
FROM node:20-alpine AS build-stage
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend and build it
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Setup the Python Backend ---
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files (main.py, db folder, etc.)
COPY . .

# Copy ONLY the built frontend files from Stage 1
# This puts the React 'dist' folder inside your app
COPY --from=build-stage /app/frontend/dist ./frontend/dist

# The command to run your app
CMD ["python", "main.py"]