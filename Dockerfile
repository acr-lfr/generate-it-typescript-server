FROM node:20 AS build

# Arguments defined in docker-compose.yml
ARG user
ARG uid

WORKDIR /code

COPY ./package.json ./package-lock.json /code/
RUN npm ci

COPY . /code
RUN npm run build

# -----------------------------------------------------
FROM node:20-alpine AS runtime

WORKDIR /code

COPY --from=build /code/package.json /code/package.json

RUN npm i --production
COPY --from=build /code/node_modules /code/node_modules
COPY --from=build /code/build /code/build

COPY --from=build /code/openapi-nodegen-api-file.yml /code/openapi-nodegen-api-file.yml

COPY ./docker-entrypoint.sh /sbin/
RUN chmod 755 /sbin/docker-entrypoint.sh

USER $user

ENTRYPOINT [ "/sbin/docker-entrypoint.sh" ]
CMD ["prod"]
