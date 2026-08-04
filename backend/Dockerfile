FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# Build-time only placeholder so `prisma generate` can validate the schema
# without a real connection; docker-compose overrides it at runtime.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"
RUN yarn prisma generate
RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]
