# ----------------------------
# Stage 1: Build React Frontend
# ----------------------------
FROM node:22-alpine as frontend_build

WORKDIR /app/client

# Copy frontend package files
COPY client/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the frontend code
COPY client/ ./

# Disable source maps to fix the "Unclosed string" / memory error
ENV GENERATE_SOURCEMAP=false

# Build the React app (creates /app/client/build)
RUN npm run build


# ----------------------------
# Stage 2: Build Backend & Serve
# ----------------------------
FROM node:22-alpine

WORKDIR /app

# Copy backend package files
COPY server/package*.json ./

# Install backend dependencies
RUN npm install

# Copy backend source code
COPY server/ .

# Copy the built React app from Stage 1 into the backend's folder
COPY --from=frontend_build /app/client/build ./client/build

# Expose the port your server runs on
EXPOSE 5000

# Start the server
CMD ["npm", "start"]