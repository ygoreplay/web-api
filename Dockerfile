# syntax=docker/dockerfile:1
FROM node:16-alpine as builder

RUN apk add --update --no-cache curl git openssh

USER node
WORKDIR /home/node

RUN mkdir /home/node/replays
RUN chown -R node:node /home/node/replays
RUN chmod 777 /home/node/replays
RUN mkdir /home/node/.ssh
RUN chown -R node:node /home/node/.ssh

RUN ssh-keyscan github.com >> /home/node/.ssh/known_hosts
RUN cat /home/node/.ssh/known_hosts

COPY --chown=node:node package*.json ./
COPY --chown=node:node yarn.lock ./
RUN --mount=type=ssh,uid=1000 ssh-add -l
RUN --mount=type=ssh,uid=1000 yarn

COPY --chown=node:node . .

ARG NODE_ENV=production
ARG APP_ENV=production

ENV NODE_ENV ${NODE_ENV}

# Remove SSH keys
RUN rm -rf /home/node/.ssh/

RUN ["yarn", "build"]
CMD ["yarn", "start:prod"]
