FROM node:12-alpine as environment

# @TODO: Build node_modules into the build
COPY ./package.json ./package-lock.json /code/
WORKDIR /code

RUN npm ci

# -----------------------------------------------------
FROM environment as build

COPY . /code

RUN npm run build

# -----------------------------------------------------
FROM environment as runtime

COPY --from=build /code/build /code/build
COPY ./docker-entrypoint.sh /sbin/
RUN chmod 755 /sbin/docker-entrypoint.sh

ENV SKIP_DB_MIGRATION="${SKIP_DB_MIGRATION:-false}"

ENTRYPOINT [ "/sbin/docker-entrypoint.sh" ]
CMD ["prod"]
