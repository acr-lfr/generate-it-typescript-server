# {{swagger.info.title}}

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [{{swagger.info.title}}](#swaggerinfotitle)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## Description

This API was generated using [openapi-nodegen](https://github.com/acrontum/openapi-nodegen)

{{swagger.info.description}}

## Setup
In a new directory run: `npm init`

Add to the dev dependencies openapi-nodegen
 - run: `npm i --save-dev openapi-nodegen`

Add the nodegen generate the server to the package.json scripts object. The following will load a local swagger file api.1.0.0.yml and generate the server with the given git repository:
```
  "scripts": {
      "generate:nodegen": "openapi-nodegen ./swagger/api_1.0.0.yml -t https://github.com/acrontum/openapi-nodegen-typescript-server.git",
```

