FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn -g add typescript
RUN yarn install
COPY . .
CMD ["yarn", "run", "start", "&", "yarn", "run", "sync"]