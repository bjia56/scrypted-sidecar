# syntax=docker/dockerfile:1
FROM node:16-bullseye

# initial update and dependencies
RUN apt update && apt -y upgrade && \
    apt -y install --no-install-recommends ffmpeg

# bring source into container
WORKDIR /server
COPY . .

# install node dependencies
RUN npm i

# run
ENTRYPOINT npm start
