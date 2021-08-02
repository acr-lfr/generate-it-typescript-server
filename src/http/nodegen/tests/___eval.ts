import * as fs from 'fs';
import { ConfigExtendedBase, Path, Schema, TemplateRenderer } from 'generate-it';
import { mockItGenerator } from 'generate-it-mockers';
import SwaggerUtils from 'generate-it/build/lib/helpers/SwaggerUtils';
import * as path from 'path';
import { format } from 'prettier';

interface Context extends ConfigExtendedBase {
  src: string;
  dest: string;
  root: string;
  filename: string;
  TemplateRenderer: TemplateRenderer;
}

type ParamResponse = Schema.Schema | Schema.Response | Schema.Parameter | string;

type Variables = { [varname: string]: ParamResponse };

type ReqParams = Record<Schema.Parameter['in'], Variables>;

interface MethodParams {
  reqParams?: ReqParams;
  responses?: Variables;
  security?: Record<string, string[]>[];
}

interface ExtractedContent {
  templateFullPath: string;
  pathName: string;
  methods: string[];
  params: {
    [method: string]: MethodParams;
  };
}

interface DomainSpec {
  className: string;
  domainName: string;
  exports: Map<string, string>;
  securityDefinitions: Record<string, Schema.Security>;
  paths: {
    [fullPath: string]: ExtractedContent;
  };
}

interface Domains {
  [opName: string]: DomainSpec;
}

interface TestData {
  fullPath: string;
  method: string;
  data: ExtractedContent;
  domainSpec: DomainSpec;
}

interface DataFileParams {
  dataTemplate: string;
  stubTemplate: string;
  validatorSchema: string[];
}

const ucFirst = (input: string): string => `${input.charAt(0).toUpperCase()}${input.slice(1)}`;

const pascalCase = (input: string): string => input.replace(/([0-9].|^[a-z])|[^a-zA-Z0-9]+(.)?/g, (_, s = '', q = '') => (s || q).toUpperCase());

const camelCase = (input: string): string =>
  input.replace(/([0-9].)|[^a-zA-Z0-9]+(.)?/g, (_, s = '', q = '', i) => (i ? (s || q).toUpperCase() : s || q));

const extractReqParams = (params: Schema.Parameter[], exportData: Map<string, string>, opId: string): ReqParams => {
  if (!params?.length) {
    return null;
  }

  const variables = {} as ReqParams;

  for (const schema of params || []) {
    const varName = schema.in === 'path' ? camelCase(`${schema.in}-${schema.name}`) : camelCase(`${opId}-${schema.in}-${schema.name}`);
    const paramDef = schema.in === 'body' ? (schema as Schema.BodyParameter).schema : schema;

    variables[schema.in] = {
      ...variables[schema.in],
      [varName]: paramDef,
    };

    // TODO: either mock a file or figure out what to do with it
    if (schema.in === 'formData') {
      exportData.set(varName, `export const ${varName} = Buffer.from('${varName}');`);
    } else {
      exportData.set(varName, `export const ${varName} = ${JSON.stringify(mockItGenerator(paramDef?.schema || paramDef))};`);
    }
  }

  return variables;
};

const extractResponses = (responses: Schema.Spec['responses']): Variables => {
  let firstSuccess: string = null;
  const variables: Variables = {};

  Object.entries(responses || {}).forEach(([code, schema]) => {
    if ((!firstSuccess && /[23]../.test(code)) || (/^3/.test(firstSuccess) && /^2/.test(code))) {
      firstSuccess = code;
    }
    variables[code] = schema;

    // handle oa3 content-type responses (by ignoring all but the first)
    if ((schema as any).content) {
      const contentSchema = (schema as any).content['application/json'] || Object.entries((schema as any).content)[0][1];
      variables[code] = contentSchema;
    }
  });

  if (firstSuccess) {
    variables[`success`] = firstSuccess;
  }

  return variables;
};

const parsePathData = (pathData: Path, exportData: Map<string, string>): ExtractedContent['params'] => {
  const params: ExtractedContent['params'] = {};

  Object.entries(pathData || {}).forEach(([method, reqData]: [string, Schema.Response]) => {
    if (method === 'endpointName' || method === 'groupName') {
      return;
    }

    params[method] = {
      reqParams: extractReqParams(reqData.parameters as Schema.Parameter[], exportData, reqData.operationId),
      responses: extractResponses(reqData.responses as Schema.Spec['responses']),
      security: reqData.security,
    };
  });

  return params;
};

const parseAllPaths = (spec: Schema.Spec): Domains => {
  let opName = '';
  const domains: Domains = {};

  // TODO: channels
  const paths = (spec.paths || {}) as Record<string, Path>;
  Object.entries(paths).forEach(([fullReqPath, pathData]) => {
    if (opName != pathData.groupName) {
      opName = pathData.groupName;

      const className = pascalCase(opName);

      domains[opName] = domains[opName] || {
        className,
        domainName: `${className}Domain`,
        paths: {},
        exports: new Map<string, string>(),
        securityDefinitions: spec.securityDefinitions,
      };
    }

    const params = parsePathData(pathData, domains[opName].exports);

    domains[opName].paths[fullReqPath] = {
      templateFullPath: fullReqPath.replace(/[\$\{:]+([^\/\}:]+)\}?/g, (_, s) => `\${testParams?.path?.${s} ?? path${ucFirst(s)}\}`),
      pathName: camelCase(fullReqPath),
      params,
      methods: Object.keys(params),
    };
  });

  return domains;
};

const getResponseExport = (method: string, name: string, schema: ParamResponse): string => {
  if (!(schema as Schema.Response)?.schema) {
    return 'Joi.object({}),';
  }

  if (schema.schema.format === 'binary') {
    return 'Joi.any(),';
  }

  return SwaggerUtils.pathParamsToJoi(schema, { paramTypeKey: 'body' as any });
};

const buildMethodDataFile = (testData: TestData): DataFileParams => {
  const { method, data, domainSpec } = testData;
  const requestParts: string[] = [`.${method}(\`\${root}${data.templateFullPath}\`)`];
  const methodParams = data.params[method];
  const queryVars: string[] = [];

  // build query params
  if (methodParams.reqParams?.query) {
    queryVars.push(
      ...Object.entries(methodParams.reqParams.query).map(([key, value]) => {
        return `${(value as Schema.Parameter).name}: ${key}`;
      })
    );
  }

  // build body or form data
  if (methodParams.reqParams?.body) {
    const [name] = Object.keys(methodParams.reqParams.body);
    requestParts.push(`.send(testParams?.body ?? ${name})`);
  } else if (methodParams.reqParams?.formData) {
    const [name] = Object.keys(methodParams.reqParams.formData);
    requestParts.push(
      `.attach('${methodParams.reqParams.formData[name].name}', testParams?.formData?.file ?? ${name}, testParams?.formData?.name ?? '${name}.png')`
    );
  }

  // build auth header
  methodParams.security?.forEach?.((security) => {
    Object.entries(security).forEach(([name]) => {
      const def = domainSpec.securityDefinitions?.[name];
      if (def) {
        switch (def.type) {
          case 'basic':
            requestParts.push(`.set('Authorization', 'Basic base64string')`);
            break;
          case 'apiKey':
            if (def.in === 'query') {
              queryVars.push(`${def.name}: 'apiKey'`);
            } else {
              requestParts.push(`.set('${def.name}', 'apiKey')`);
            }
            break;
          case 'oauth2': // TODO
            if ((def as Schema.OAuth2AccessCodeSecurity).tokenUrl) {
              queryVars.push(`tokenUrl: '${(def as Schema.OAuth2AccessCodeSecurity).tokenUrl}'`);
            }
            if ((def as Schema.OAuth2AccessCodeSecurity).authorizationUrl) {
              queryVars.push(`authorizationUrl: '${(def as Schema.OAuth2AccessCodeSecurity).authorizationUrl}'`);
            }
            queryVars.push(`scope: '${Object.keys(def.scopes || {}).join(',')}'`);
            break;
        }
      }
    });
  });

  if (queryVars?.length) {
    requestParts.push(`.query(testParams?.query ?? { ${queryVars.join(', ')} })`);
  }

  // build responses
  const successCode = methodParams?.responses?.success as string;
  const successResponse = methodParams?.responses?.[successCode];
  const successSchema = (successResponse as Schema.Response)?.schema ?? successResponse;

  const responseName = `${data.pathName}${ucFirst(method)}`;
  const validatorSchema: string[] = [];
  let responseKey = 'body';

  Object.entries(methodParams.responses).forEach(([code, schema]) => {
    if (code === 'success') {
      return;
    }
    const varName = `${responseName}${code}`;
    const responseValidator = getResponseExport(method, varName, schema);

    validatorSchema.push(`  ${varName}: ${responseValidator}`);
    if (code === successCode) {
      validatorSchema.push(`  ${responseName}Success: ${responseValidator}`);
    }

    const schemaFmt = (schema as Schema.Response)?.schema;
    if (['string', 'number', 'integer', 'boolean'].includes(schemaFmt?.type) && schemaFmt?.format !== 'binary') {
      responseKey = 'text';
    }
  });

  if (validatorSchema?.length) {
    domainSpec.exports.set('responseValidator', 'true');
  }

  const statusCode = successCode || 200;

  const dataTemplate = `\
  // ${responseName}
  //
  public static ${responseName}Path(testParams?: TestParams): string {
    return \`${data.templateFullPath}\`;
  };

  public static ${responseName}(testParams?: TestParams, root = baseUrl): supertest.Test {
    return request
      ${requestParts.join('\n        ')}
  }`;

  const stubTemplate = `\
  it('can ${method.toUpperCase()} ${testData.fullPath}', async () => {
    const testParams: TestParams = {};
    await Test${domainSpec.domainName}.${responseName}(testParams)
      .expect(({ status, ${responseKey} }) => {
        expect(status).toBe(${statusCode});
        expect(${responseKey}).toBeDefined();${
    successSchema
      ? `
        const validated = responseValidator(\`${responseName}\${testParams?.statusCode ?? ${statusCode}}\`, ${responseKey});
        if (validated.error) {
          console.error(validated.error);
        }
        expect(!!validated.error).toBe(false);`
      : ''
  }
      });
  });`;

  return { dataTemplate, stubTemplate, validatorSchema };
};

const generateTestHelperFileContent = (domainName: string, classBody: string[], imports = ''): string => `\
import { baseUrl, request, TestParams, TestRequest } from '@/http/nodegen/tests';
import * as supertest from 'supertest';
${imports ? imports + '\n' : ''}
export class Test${domainName} {
${classBody.join('\n\n')}
}
`;

const generateIndexFile = (toImport: string[], toExport: string[]): string => `\
import app from '@/app';
import { HttpStatusCode } from '@/http/nodegen/errors';
import { NodegenRequest } from '@/http/nodegen/interfaces';
import { default as WorkerService } from '@/http/nodegen/request-worker/WorkerService';
import { baseUrl as root } from '@/http/nodegen/routesImporter';
import { default as AccessTokenService } from '@/services/AccessTokenService';
import { NextFunction, RequestHandler, Response } from 'express';
import { default as supertest } from 'supertest';
import { ReadStream } from 'fs';
${toImport?.length ? toImport.sort().join('\n') : ''}

export interface TestParams {
  query?: Record<string, any>;
  body?: Record<string, any>;
  path?: Record<string, any>;
  headers?: Record<string, any>;
  formData?: {
    file: Blob | Buffer | ReadStream | string | boolean | number;
    name?: string;
  };
  statusCode?: number;
  // other supertest stuff
}

export interface TestRequest {
  /**
   * Returns a supertest request method for building your own tests
   *
   * eg: await SomethingTests
   *   .somethingDomainIdPut
   *   .request({ query: 'hallo' })
   *   .expect(({ status, body }) => ... your tests here ...
   *
   * @param {TestParams}  testParams  The test parameters
   */
  request(testParams?: TestParams): supertest.Test;

  /**
   * Send and test the default request (as per swagger)
   *
   * eg:
   *   await SomethingTests.testDefault();
   *
   * @param {TestParams}  testParams  The test parameters (query, path, data, etc)
   */
  testDefault(testParams?: TestParams): supertest.Test;

  /**
   * A basic test name for something like "it(specName, () => {})"
   *
   * eg: 'can PUT /something-domain/{id}/',
   */
  specName: string;

  /**
   * A unique key used to index things like the validator
   *
   * eg: 'somethingDomainIdPut'
   */
  testKey: string;

  /**
   * The full api path used to test against
   *
   * eg: '/v1/something-domain/10'
   */
  path: string;
}

export type TestData<T = {}> = Record<keyof T, any>;

export type GeneratedTestDomain<T = {}> = Record<keyof T, TestRequest>;

// sucks these can't be on-demand - jest needs to hoist them so that anything importing them gets the mock.
jest.mock('morgan', () => () => (req: NodegenRequest, res: Response, next: NextFunction) => next());
jest.mock('@/http/nodegen/middleware/asyncValidationMiddleware', () => () => (req: NodegenRequest, res: Response, next: NextFunction) => next());

export const baseUrl = root.replace(/\\/*$/, '');
export let request: supertest.SuperTest<supertest.Test>;

export const ResponseCodes = {
  delete: [HttpStatusCode.OK, HttpStatusCode.NO_CONTENT],
  get: [HttpStatusCode.OK],
  patch: [HttpStatusCode.NO_CONTENT],
  post: [HttpStatusCode.CREATED],
  put: [HttpStatusCode.CREATED, HttpStatusCode.NO_CONTENT],
};

export const setupTeardown = {
  beforeAll: async () => {
    request = supertest((await app(0)).expressApp);
  },
  beforeEach: () => {},
  afterEach: () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.resetAllMocks();
  },
  afterAll: async () => {
    await WorkerService.close();
  }
};

// don't call twice...
let setupCalled = false;

export const defaultSetupTeardown = () => {
  if (setupCalled) {
    return;
  }
  setupCalled = true;
  beforeAll(setupTeardown.beforeAll);
  beforeEach(setupTeardown.beforeEach);
  afterEach(setupTeardown.afterEach);
  afterAll(setupTeardown.afterAll);
};

export type Async<T> = T extends (...args: infer T) => infer T ? Promise<T> : never;

/**
 * Auth middleware mocker
 *
 * By default, a simple pass-through middleware is used (req, res, next) => next()
 *
 * If your auth flow requires side-effects (eg setting req.user = 'something') then
 * you will want to pass in a custom middleware mocker to handle that case
 *
 * @param {RequestHandler}  middleware  Replaces AccessTokenService.validateRequest
 */
export const mockAuth = (middleware?: Async<RequestHandler>) => {
  jest
    .spyOn(AccessTokenService, 'validateRequest')
    .mockImplementation(
      middleware ||
        ((req: NodegenRequest, res: Response, next: NextFunction) => next())
    );
};

${toExport?.length ? toExport.join('\n') : ''}
`;

const generateTestStub = (basePath: string, domainSpec: DomainSpec, tests: string[], useAuth?: boolean): boolean => {
  basePath = basePath.replace(/\/+$/, '');

  const outputPath = `${basePath}/${domainSpec.domainName}.api.spec.ts`;
  if (fs.existsSync(outputPath)) {
    return false;
  }
  fs.mkdirSync(basePath, { recursive: true });

  const template = `\
import { defaultSetupTeardown,${useAuth ? 'mockAuth,' : ''} TestParams, Test${domainSpec.domainName} } from '@/http/nodegen/tests';
import { responseValidator } from '@/http/nodegen/tests/${domainSpec.domainName}.data';

defaultSetupTeardown();

describe('${domainSpec.domainName}', () => {${
    useAuth
      ? `
  beforeEach(async () => {
    mockAuth();  // Disable auth middleware
  });
  `
      : ''
  }

  ${tests.join('\n\n')}
});
`;

  createFormattedFile(outputPath, template);

  return true;
};

const mapKeys = (map: Map<any, any>) => Array.from(map, ([key]) => key);

const mapValues = (map: Map<any, any>) => Array.from(map, ([_, value]) => value);

const createFormattedFile = (path: string, data: string) =>
  fs.writeFileSync(
    path,
    format(data, {
      bracketSpacing: true,
      endOfLine: 'auto',
      semi: true,
      printWidth: 120,
      singleQuote: true,
      quoteProps: 'consistent',
      filepath: path,
    })
  );

const getValidator = (validatorSchemas: string[]) => `\
export const validationSchemas: Record<string, Joi.AnySchema> = {
${validatorSchemas.join('\n')}
}

export const responseValidator = (responseKey: string, schema: any): Joi.ValidationResult => {
  return validationSchemas[responseKey].validate(schema);
}`;

const writeTestDataFile = (path: string, domainSpec: DomainSpec, validatorSchemas: string[]) => {
  const dataExports: string[] = mapValues(domainSpec.exports).filter((key) => key !== 'true');
  if (validatorSchemas?.length) {
    dataExports.unshift(`import * as Joi from 'joi';`);
    dataExports.push(getValidator(validatorSchemas));
  }
  createFormattedFile(path, dataExports.join('\n\n'));
};

const buildSpecFiles = (ctx: Context): void => {
  if (!ctx.nodegenRc?.helpers?.tests) {
    return;
  }

  const testOutput = path.join(ctx.targetDir, ctx.nodegenRc?.helpers?.tests?.outDir || 'src/domains/__tests__');

  const domains = parseAllPaths(ctx.swagger);

  const indexExports: string[] = [];

  Object.entries(domains).forEach(([opName, domainSpec]) => {
    const specFileName = `${domainSpec.domainName}`;
    const dataTemplates: string[] = [];
    const stubTemplates: string[] = [];
    const validatorSchemas: string[] = [];
    let useAuth: boolean = false;

    Object.entries(domainSpec.paths).forEach(([fullPath, data]) => {
      data.methods.forEach((method) => {
        const { dataTemplate, stubTemplate, validatorSchema } = buildMethodDataFile({
          fullPath,
          method,
          data,
          domainSpec,
        });
        /*wrap class*/
        dataTemplates.push(dataTemplate);
        stubTemplates.push(stubTemplate);
        validatorSchemas.push(...validatorSchema);
        useAuth = useAuth || !!data.params[method]?.security?.length;
      });
    });

    if (domainSpec.exports.size > 0) {
      writeTestDataFile(`${ctx.dest}/${specFileName}.data.ts`, domainSpec, validatorSchemas);
    }

    indexExports.push(`export { Test${specFileName} } from './${specFileName}';`);

    const importString = domainSpec.exports.size
      ? `import { ${mapKeys(domainSpec.exports).sort().join(', ')} } from './${specFileName}.data';`
      : null;
    createFormattedFile(`${ctx.dest}/${specFileName}.ts`, generateTestHelperFileContent(domainSpec.domainName, dataTemplates, importString));
    generateTestStub(testOutput, domainSpec, stubTemplates, useAuth);
  });

  fs.writeFileSync(`${ctx.dest}/index.ts`, generateIndexFile([], indexExports));
};

export default buildSpecFiles;
