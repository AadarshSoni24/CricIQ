FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files (including local venue_features.csv)
COPY . .

# Expose Express default port
EXPOSE 5000

# Start Express server
CMD ["node", "index.js"]
