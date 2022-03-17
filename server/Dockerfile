# syntax=docker/dockerfile:1
FROM node:16-bullseye

# initial update
RUN apt update && apt -y upgrade

# dependencies
RUN apt -y install ffmpeg

# bring source into container
WORKDIR /server
COPY . .

# install node dependencies
RUN npm i

# run
ENTRYPOINT npm start
