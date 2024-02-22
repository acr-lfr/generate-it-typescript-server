FROM node:20 AS build

WORKDIR /code

COPY ./package.json ./package-lock.json /code/
RUN npm ci

COPY . /code
RUN npm run build

# -----------------------------------------------------
FROM node:20-alpine AS runtime

WORKDIR /code

COPY --from=build /code/package.json /code/package.json
COPY --from=build /code/package-lock.json /code/package-lock.json

RUN npm ci --omit=optional --omit=dev && npm cache clean --force
RUN npm audit --omit=optional --omit=dev

COPY --from=build /code/build /code/build
COPY --from=build /code/openapi-nodegen-api-file.yml /code/openapi-nodegen-api-file.yml

COPY ./docker-entrypoint.sh /sbin/
RUN chmod 755 /sbin/docker-entrypoint.sh

RUN chown -R node:node /code/
USER node

ENTRYPOINT [ "/sbin/docker-entrypoint.sh" ]
CMD ["prod"]
