FROM node:10-alpine
WORKDIR /var/app
RUN apk add --no-cache ca-certificates tzdata build-base make python
COPY package.json yarn.lock ./
RUN yarn install --ignore-engines --network-timeout 1000000
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["node", "dist/server/index.js"]
