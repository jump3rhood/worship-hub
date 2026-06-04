# ---- Stage 1: Build React frontend ----
FROM node:20-alpine AS builder
WORKDIR /build

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build


# ---- Stage 2: Production image ----
FROM node:20-alpine
WORKDIR /app

# Install production server dependencies only
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server source and built React app.
# Keep the same relative layout so server/index.js finds ../client/dist correctly.
COPY server/ ./server/
COPY --from=builder /build/dist ./client/dist/

# /data is where SQLite lives. Mount a Railway persistent volume here
# so the database survives deploys and restarts.
RUN mkdir -p /data

ENV NODE_ENV=production
ENV DB_PATH=/data/worship.db

EXPOSE 3001

CMD ["node", "server/index.js"]
