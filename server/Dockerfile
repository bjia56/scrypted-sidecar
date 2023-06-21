# syntax=docker/dockerfile:1
FROM node:18-bullseye

# initial update and dependencies
RUN apt update && apt -y upgrade
RUN wget -q -O /usr/bin/ffmpeg https://github.com/koush/scrypted-ffmpeg/releases/download/v1.0.6/ffmpeg-debian-x64 && \
    chmod +x /usr/bin/ffmpeg

# bring source into container
WORKDIR /server
COPY . .

# install node dependencies
RUN npm i --production

# run
ENTRYPOINT npm start
