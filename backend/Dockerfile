FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time only placeholder so `prisma generate` can validate the schema
# without a real connection; docker-compose overrides it at runtime.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
