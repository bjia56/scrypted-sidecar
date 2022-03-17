# syntax=docker/dockerfile:1
FROM node:16-bullseye

# initial update
RUN apt update && apt -y upgrade

# bring source into container
WORKDIR /web
COPY . .

# install node dependencies and build
RUN npm i
RUN npm run build

# run
ENTRYPOINT npm start