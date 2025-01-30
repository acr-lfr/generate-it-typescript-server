# openapi-nodegen typescript server template files

<!-- npx doctoc --github README.md  -->

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [High level design](#high-level-design)
    - [Design Philosophy](#design-philosophy)
    - [Accessing your API via CLI](#accessing-your-api-via-cli)
    - [Testing](#testing)
- [Injecting into the http layer](#injecting-into-the-http-layer)
- [Configuring builtin middlewares](#configuring-builtin-middlewares)
- [API Spec file helpers/features](#api-spec-file-helpersfeatures)
    - [Access full request in domain](#access-full-request-in-domain)
    - [Allow non authenticated request to access domain](#allow-non-authenticated-request-to-access-domain)
    - [CLI](#cli)
    - [Inferring output content-type](#inferring-output-content-type)
      - [application/vnd.api+json](#applicationvndapijson)
    - [Input/ouput filters (validation)](#inputouput-filters-validation)
    - [Async route validation](#async-route-validation)
        - [A standard setup:](#a-standard-setup)
        - [Inject parameters to the async function:](#inject-parameters-to-the-async-function)
    - [Permission helper](#permission-helper)
    - [NodegenRC Helpers](#nodegenrc-helpers)
      - [Jwt Definition](#jwt-definition)
      - [Extending the request object](#extending-the-request-object)
    - [Access validation service](#access-validation-service)
    - [Caching](#caching)
    - [Errors](#errors)
- [Setup](#setup)
    - [Specifying basePath in OA3](#specifying-basepath-in-oa3)
    - [Tip 1 local api file pointer](#tip-1-local-api-file-pointer)
    - [Tip 2 for older versions of openapi-nodegen](#tip-2-for-older-versions-of-openapi-nodegen)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## High level design
The http layer is completely managed, uses expressjs & lives at the location specified by `.nodegenrc` `nodegenDir` key (default is `src/http/`). All files in the `nodegenDir` folder are overwritten each time you regenrate.  

The `app.ts` calls the `src/http/index.ts` which returns the initialized express app. You can inject middleware and other options, see the `HttpOptions` interface in the `src/http/index.ts`.

The domain layer is where all business logic should live, the domain layer is initially generated from [\_\_\_stub](https://acr-lfr.github.io/generate-it/#/_pages/templates?id=stub) templates from generate-it.  
**NOTE**: Stub files are created if they do not exist, but not overwritten each generation.  

#### Design Philosophy
The overall design pattern for the architecture is influenced by traditional [MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) but also the popular frameworks like [laravel](https://laravel.com/) and [symfony](https://symfony.com/):  
- The `app.ts` loads database connections and the express framework, including the middlewares and routes.
- The generated routes, imported from the generated `src/http/nodegen/routesImporter.ts`, handle all incoming HTTP traffic and validation (both input and output).
- Each route will lead to a domain method (`src/domains`) which houses the business logic, eg your custom code.
- Data returned from a domain method is captured by the same route function it is was called from, the router sends the output to the `inferResponseType.ts` response middleware which outputs data in the format requested from the client in conjunction with the permitted types defined by the openapi file.

#### Accessing your API via CLI
Similar to the Symfony framework CLI, commands should be written and stored - in this case in the `src/cli` directory. The sequence is:
- Write and store a script in `src/cli`, no special format required, just a simple script and you have full access to your apps code.
  - Could be as simple as `console.log('hello world')`
- Lets say the script was named `seedUsers.ts`; call it like this `npm run cli-script -- seedUsers`
  - The `server.ts` loads the app as normal.
  - After initializing the `app.ts` it will simply call your script opposed to starting another instance of your API.
  - With the business logic completely extracted into the domain layer, you can easily access this layer without mocking any of http content. 

#### Testing
With the http layer is now managed, that frees up some time for writing tests. Additionally, you can auto-generate some basic tests for your domains by specifying a test output directory in the nodegenrc file:
```json
{
  "nodegenDir": "src/http",
  "helpers": {
    "tests": {
      "outDir": "src/domains/__tests__"
    }
  }
}
```
This will generate some basic test helper files in `<nodegenDir>/tests/` as well as integration tests for your domains in `helpers.tests.outDir`. These should serve as a starting point and guide, but it's very likely your API will outgrow these basic tests.  
The integration tests are stubfiles - meaning they are not overwritten during generation - so you can modify them as you like. When you make changes to the API spec, you will likely want to update them the same way as other stubfiles (eg domains) so that all routes are covered.  

Alternatively (or additionally) see the [known-templates](https://acr-lfr.github.io/generate-it/#/_pages/known-templates) page for the API test rig which allows you to test your API using mocks.

## Injecting into the http layer
You can inject some customization into the http layer from the app.ts file, common use cases are to inject additional request middlewares or error handlers. It is also possible to override the stock error logger and optionally inject a hook called when the http exception is hit.

Here is an example using all the options available, custom request and error middlewares and error logger and hook into the httpException handler.
````typescript
import express from 'express';
import expressRateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser'
import path from 'path';
import { typeOrmErrorHandler, httpErrorLogger, httpErrorHook } from 'your-project/common-utils' 
import config from '@/config';
import RabbitMQService from '@/events/rabbitMQ/RabbitMQService';
import http, { Http } from '@/http';

// Rate limiting
const limiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15 * 60 // 1 request per second
});

/**
 * Returns a promise allowing the server or cli script to know
 * when the app is ready; eg database connections established
 */
export default async (port: number): Promise<Http> => {
  // Here is a good place to connect to databases if required or setup
  // filesystems or any other async action required before starting:
  await RabbitMQService.setup(config.rabbitMQ);

  // Milliseconds for 1 year
  const oneYearMS = 1000 * 60 * 60 * 24 * 365;

  // Return the http layer, to inject custom middleware pass the HttpOptions
  // argument. See the @/http/index.ts
  return http(port, {
    // Injecting static routes, an API limiter an a cookie parser into the app:
    requestMiddleware: [
      ['/image', express.static(path.join(config.file.baseFolderPath, config.file.resizedMount,), { maxAge: oneYearMS })],
      limiter,
      cookieParser
    ],
    // Injecting custom database error handlers making use of the raw error as thrown from the app
    errorMiddleware: [
      typeOrmErrorHandler
    ],
    // Injecting a custom error logger and error hook into the catchall htp exception handeler
    httpException: {
      errorHook: httpErrorHook,
      errorLogger: httpErrorLogger
    }
  });
};
````

## Configuring builtin middlewares
Some of the parameters to the builtin app middlewares can be customized using the `appMiddlewareOptions` parameter.

In the following example we disable accesss logger middleware for a specific URL so we don't pollute our log file with empty "GET" request logs.
We can also customize the default helmet settings in the same way.
````typescript
import express from 'express';
import path from 'path';
import config from '@/config';
import RabbitMQService from '@/events/rabbitMQ/RabbitMQService';
import http, { Http } from '@/http';
// ...

/**
 * Returns a promise allowing the server or cli script to know
 * when the app is ready; eg database connections established
 */
export default async (port: number): Promise<Http> => {
  // Here is a good place to connect to databases if required or setup
  // filesystems or any other async action required before starting:
  await RabbitMQService.setup(config.rabbitMQ);

  // Return the http layer, to inject custom middleware pass the HttpOptions
  // argument. See the @/http/index.ts
  return http(port, {
    accessLogger: {
      // Disable logging for requests to our healthcheck endpoint
      skip: (req) => req.method === 'GET' && req.originalUrl === '/health'
    },
    helmet: {
      hidePoweredBy: true,
    },
  });
};
````

## API Spec file helpers/features
These templates inject into the code helpful elements depending on the provided api file.

#### Access full request in domain
Accessing the full request object is handled by the core feature: [pass-full-request-object-to-\_\_\_stub-method](https://acr-lfr.github.io/generate-it/#/_pages/features?id=pass-full-request-object-to-___stub-method). Similarly, you can also get access to the response using `x-passResponse`. **NOTE** you must manually complete the response (eg `res.json({ hello: 'world' })`), otherwise your HTTP call will hang.  

#### Allow non authenticated request to access domain
With some API designs there is the need to offer 1 API route which returns content for authenticated users and non-authenticated users. The content could be a newsfeed for example with authenticated users getting a extra attributes in the new objects returned compared to non-authenticated users.

This can be achieved by marking a route with an additional attribute: `x-passThruWithoutJWT`

This will pass the request through to the domain with or without a jwt, but it also allows the domain to check if a decoded token has been passed or not. Invalid tokens will result in an unauthenticated response from the route and not hit the domain. The output will also pass the JwtAccess to the domain with `| undefined` making it very clear within the domain that the decoded jwt may or may not be there:
```typescript
  public async weatherIdGet(
    jwtData: JwtAccess | undefined,
    path: WeatherIdGetPath
  ): Promise<WeatherFull> {
    // check jwtData and react accordingly
  }
```

#### CLI 
You can run scripts will full access to the loaded api via the cli-scripts command:
```
npm run cli-script -- user-seeder
```
This will pass "user-seeder" to `src/cli/run.ts` which will attempt to execute the provided script.

If the runner cannot find the provided script within the cli folder an error is thrown.

By default `src/cli/run.ts` will not run on production.

#### Inferring output content-type
The `inferResponseType` middleware will infer which `content-type` to return based on the requests `Access` header and what you provide the API on generation via openapi. The fallback is always `application/json`.

To output a file, for example a PDF, the domain layer should return the absolute path in a simple string. Assuming the openapi states it can produce the desired format, in this case `application/pdf`, then the `inferResponseType` will call the express `res.download` method.

See `src/http/nodegen/middleware/inferResponseType.ts`

##### application/vnd.api+json
For the most typical use case no additional work is required, however in some cases you may find that the consumer sends for application/json something like: `application/vnd.api+json` or similar.

In this case you can extend the default produces types using a top level produces attribute in your openapi file eg if you are using BOATS:
```
swagger: "2.0"

info:
  description: [[ packageJson('description') ]]
  version: [[ packageJson('version') ]]
  title: [[ packageJson('name') ]]
  contact:
    email: bob@generate-it.com

schemes:
  - "http"
  - "https"

host: [[ host if host else 'localhost:8000' ]]

produces:
 - application/vnd.api+json
```

#### Input/ouput filters (validation)
The [**input**](https://github.com/acr-lfr/openapi-nodegen-typescript-server/blob/master/src/http/nodegen/routes/___op.ts.njk#L29) is protected by the npm package [celebrate](https://www.npmjs.com/package/celebrate). Anything not declared in the request by the swagger file will simply result in a 422 error being passed back to the client and will not hit the domain layer.

The [**output**](https://github.com/acr-lfr/openapi-nodegen-typescript-server/blob/master/src/http/nodegen/routes/___op.ts.njk#L33) is protected by the npm package [object-reduce-by-map](https://www.npmjs.com/package/object-reduce-by-map) which strips out any content from an object or array, or array of objects that should not be there.

Both the input and output are provided the request and response object, respectively, from the api file.

This means that once in the domain layer you can be safe to think that there is no additional content in the request object than that specified in the swagger file.

Conversely, as the output is reduced, should a domain accidentally return attributes it shouldn't they will never be passed back out to the client.

Celebrate is the express middleware validating input, it uses Joi under the hood. You can inject Joi options on a path by path level via x-joi-options eg:
```yaml
x-joi-options:
  allowUnknown: true
```
All options can be found here: https://github.com/sideway/joi/blob/master/API.md#anyvalidatevalue-options

#### Async route validation 
Celebrate will cover 90% of the validation needs of an API, but there is always a % of use cases wherein you need to perform an async action to before permitting the user to hit a domain layer. The most common use case is when you want to validate incoming data against a database record, for example, a registration form checking that a given email/username is not already registered. These types of validators do no always fit the Joi style of validation that is under the hood of celebrate.

Any async validator will be executed before the domain layer is hit. 
Any error thrown in an async validator will stop the request reaching the domain layer.

###### A standard setup:
Setting up an async validation for any given route, add to your path object the `x-async-validators` attribute containing and array of method names:

`src/paths/register/post.yml`
```yaml
summary: Register
description: Register a new user account
operationId: RegisterPost
produces:
  - application/json
parameters:
  - in: body
    name: RegisterPost
    required: true
    schema:
      $ref: ../../../definitions/register/email/post.yml
x-async-validators:
  - uniqueUsername
```
Regenerate your API and create a method in the `src/services/AsyncValidationService.ts` class by that name, and that is about it. Fill in the method to do as you need and be on your merry way, eg:
```typescript
class AsyncValidationService {
  async uniqueUsername (req: NodegenRequest, asyncValidatorParams: string[]): Promise<void> {
    // Run the async function and throw the required error when needed
    const user = await db.user.findOne({ username: req.body.username })
    if(user){
      throw http422()
    }
  }
}
```

###### Inject parameters to the async function:
You can pass in additional fixed params to the validator via a `:` separator:
```yaml
x-async-validators:
  - uniqueEntry:user:username
```
The function called will find these params given to it, eg:
```typescript
class AsyncValidationService {
  async uniqueEntry (req: NodegenRequest, asyncValidatorParams: string[]): Promise<void> {
    // Run the async function and throw the required error when needed
    const user = await db[asyncValidatorParams[0]].findOne({ 
      [asyncValidatorParams[1]]: req.body[asyncValidatorParams[1]] 
    })
    if(user){
      throw http422()
    }
  }
}
```

#### Permission helper
`src/http/nodegen/routes/___op.ts.njk` will look for the `x-permission` attribute within a path object eg:
```
x-permission: adminUsersDelete
```
It will then [inject the permission middleware](https://github.com/acr-lfr/openapi-nodegen-typescript-server/blob/master/src/http/nodegen/routes/___op.ts.njk#L28) to the give path and pass the said middleware the provided permission string. In the above case, "adminUserDelete" will be passed.

#### NodegenRC Helpers
The default `.nodegenrc` will contain:
```json
{
  "nodegenDir": "src/http/nodegen",
  "nodegenMockDir": "src/domains/__mocks__",
  "nodegenType": "server",
  "helpers": {
    "noDomainDocBlock": false,
    "stub": {
      "jwtType": "JwtAccess",
      "requestType": "NodegenRequest",
      "requestTypeExtensionPath": "@/interfaces/NodegenRequest"
    }
  }
}
```

- "noDomainDocBlock" will omit the docblock for each domain method from the output when true.
- The stub helpers will mean the domain method types will be `JwtAccess` or `NodegenRequest` opposed to `any`.
  - The `NodegenRequest` interface is [provided by these templates](https://github.com/acr-lfr/openapi-nodegen-typescript-server/blob/master/src/http/nodegen/interfaces/NodegenRequest.ts) out of the box so nothing extra required (a domain gets a full req object based on the [core feature](https://acr-lfr.github.io/openapi-nodegen/#/_pages/features?id=pass-full-request-object-to-___stub-method)). This interface extends the express request interface with the additional attributes added by this setup.

##### Jwt Definition 
The `JwtAccess` interface is not provided, it expects that you have in your api file a definition by this name. You can see an example in the core: [example JwtAccess interface](https://github.com/acr-lfr/openapi-nodegen/blob/develop/test_swagger.yml#L176). If you want to use a different interface name, change the value of "jwtType", if you don't want it at all, just delete it from your `.nodegenrc` file.

It also expects that you name it "jwtToken" in the yaml file.

##### Extending the request object
By default, the request object received in the domain is extended with the interface `NodegenRequest`. By setting the optional parameter
`helpers.stub.requestTypeExtensionPath` in the `.nodegenrc`, you can provide an interface from which `NodegenRequest` will also extend.

For example, to extend the request with a user, set `helpers.stub.requestTypeExtensionPath: "src/interfaces/RequestExtension"`

`src/interfaces/RequestExtension.ts`
```typescript
export default interface RequestExtension {
  user: User
}
```

#### Access validation service
Within the nodegen folder there is a middlware `accessTokenMiddleware.ts` injected into the routes when a security attribute is found in the api path.

This middleware passes the details onto the provided AccessTokenService: `AccessTokenService.validateRequest(req, res, next, headerNames)`

The entry method is given an array of strings, eg for a route requiring either jwt or api key it might be: `['authorization','api-key']'`. This is enough information to then validate the values of the said header thus validating the request.

Out of the box it is quite simple and it is expected that you inspect and update this service to fit the needs of your app.

#### Caching
The middleware `src/http/nodegen/middleware/headersCaching.ts` is a proxy function to `HttpHeadersCacheService`.

This allows you to control the cache headers returned. Alternatively you may wish to inject your own caching service logic here as you have full access to the request and response object.

#### Errors
However nice all the automated layer is, once in the domain method it is common to want to throw some http error codes from the domain. Each of the error [helpers here](https://github.com/acr-lfr/openapi-nodegen-typescript-server/tree/master/src/http/nodegen/errors) have their own handle [middleware](https://github.com/acr-lfr/openapi-nodegen-typescript-server/tree/master/src/http/nodegen/middleware). For more info on each take a read of the comments within the files.  

It's recommended you use the `Exception.ts` classes when throwing errors - the `4xx.ts` files are deprecated and exist for backwards compatibility reasons.  

Additionally, using the exception classes allows for control over the error response format by passing all errors through the error pre-formatter [HttpErrorsService.ts](src/services/HttpErrorsService.ts). This way, you can define custom error responses for all errors.

#### Raw body

If you require the express raw body add this to the respective path:
```
x-raw-body: true
```

This will result in no validation, no token checks, no body parsing, the domain will be provided the body in a raw format,

If you are handling webhooks from 3rd parties such as Stripe, you will need this flag set.


## Setup
In a new directory run: `npm init`

Add to the dev dependencies openapi-nodegen
 - run: `npm i --save-dev openapi-nodegen`

Add the nodegen generate the server to the package.json scripts object. The following will load a local swagger file api.1.0.0.yml and generate the server with the given git repository:
```
  "scripts": {
      "generate:nodegen": "openapi-nodegen ./api_1.0.0.yml -t https://github.com/acr-lfr/openapi-nodegen-typescript-server.git",
```

#### Specifying basePath in OA3

If you need to specify the `basePath` edit the `src/app.ts` and add the `basePath` as second parameter to the `routesImporter`.

For example:

`src/app.ts`
```typescript
routesImporter(app, '/v1');
```


#### Tip 1 local api file pointer
Typically the generation is only done during development. Typically you would orchestrate a full spec file from many little files then build 1 file to share to both openapi-nodegen and things like AWS or other gateways. To make life easier, you can simply point openapi-nodegen to the working directory of your api file repo, instead of manually copying the built file:
 ```
   "scripts": {
       "generate:nodegen": "openapi-nodegen ../auth-api-d/built/api_1.0.0.yml -t https://github.com/acr-lfr/openapi-nodegen-typescript-server.git",
 ```

#### Tip 2 for older versions of openapi-nodegen

Reference a tag:
```
  "scripts": {
      "generate:nodegen": "openapi-nodegen ./swagger/api_1.0.0.yml -t https://github.com/acr-lfr/openapi-nodegen-typescript-server.git#3.0.6",
```
