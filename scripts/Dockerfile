FROM node:20-alpine AS build
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install app dependencies
COPY package.json yarn.lock ./
COPY ecosystem.config.cjs ./
COPY service-account.json ./

RUN yarn

# Bundle app source
COPY . .

RUN npm run build
# development runner (ARM/M1 compatible)

# Remove packages specified in your devDependencies
RUN npm prune --production && npm cache clean --force

FROM node:20-alpine

ENV PORT=7777
EXPOSE $PORT

WORKDIR /app

COPY --chown=node:node --from=build /app/node_modules node_modules
COPY --chown=node:node --from=build /app/dist dist
COPY --chown=node:node --from=build /app/package.json ./
COPY --chown=node:node --from=build /app/ecosystem.config.cjs ./
COPY --chown=node:node --from=build /app/service-account.json ./

RUN mkdir .adminjs
RUN chmod 777 .adminjs
RUN chown nobody:nobody .adminjs

# Install PM2 globally
RUN npm install pm2 -g

USER node

CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
