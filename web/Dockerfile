# syntax=docker/dockerfile:1
FROM node:16-alpine

# dependencies
RUN apk add --update --no-cache g++ make python3

# bring source into container
WORKDIR /web
COPY . .

# install node dependencies and build
RUN npm i && npm run build

# run
ENTRYPOINT npm start