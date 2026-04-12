ARG NODE_VERSION=24.12.0-alpine

FROM node:${NODE_VERSION} AS dev

WORKDIR /app

COPY package.json package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm npm install

COPY . .

# Expose the port used by the Vite development server
EXPOSE 5173

# Use a default command, can be overridden in Docker compose.yml file
CMD ["npm", "run", "dev"]