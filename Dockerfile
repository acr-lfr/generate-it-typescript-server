FROM node:14-alpine as environment

WORKDIR /code

COPY ./package.json ./package-lock.json /code/

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

ENTRYPOINT [ "/sbin/docker-entrypoint.sh" ]
CMD ["prod"]
