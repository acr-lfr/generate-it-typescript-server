import * as fs from 'fs';
import { ConfigExtendedBase, Path, Schema, TemplateRenderer } from 'generate-it';
import { mockItGenerator } from 'generate-it-mockers';
import prettier from 'generate-it/build/lib/helpers/prettyfyRenderedContent';
import SwaggerUtils from 'generate-it/build/lib/helpers/SwaggerUtils';

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

interface ExtractedContent {
  templateFullPath: string;
  pathName: string;
  methods: string[];
  params: {
    [method: string]: {
      reqParams?: ReqParams;
      responses?: Variables;
    };
  };
}

interface DomainSpec {
  className: string;
  domainName: string;
  exports: Map<string, string>;
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

const ucFirst = (s: string): string => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

const extractReqParams = (params: Schema.Parameter[], exportData: Map<string, string>): ReqParams => {
  if (!params?.length) {
    return null;
  }

  const variables = {} as ReqParams;

  for (const schema of params || []) {
    const varName = `${schema.in}${ucFirst(schema.name)}`;
    const paramDef = ((schema as Schema.BodyParameter).schema || schema) as Schema.Schema;

    variables[schema.in] = {
      ...variables[schema.in],
      [varName]: paramDef,
    };

    exportData.set(varName, `export const ${varName} = ${JSON.stringify(mockItGenerator(paramDef))};`);
  }

  return variables;
};

const extractResponses = (responses: Schema.Spec['responses']): Variables => {
  let firstSuccess: string = null;
  const variables: Variables = {};

  Object.entries(responses || {}).forEach(([code, schema]) => {
    if (!firstSuccess && /2../.test(code)) {
      firstSuccess = code;
    }
    variables[code] = schema;
  });

  if (firstSuccess) {
    variables[`success`] = firstSuccess;
  }

  return variables;
};

const parsePathData = (pathData: Path, exportData: Map<string, string>): ExtractedContent['params'] => {
  const params: ExtractedContent['params'] = {};

  Object.entries(pathData || {}).forEach(([method, reqData]) => {
    if (method === 'endpointName' || method === 'groupName') {
      return;
    }

    params[method] = {
      reqParams: extractReqParams(reqData.parameters as Schema.Parameter[], exportData),
      responses: extractResponses(reqData.responses as Schema.Spec['responses']),
    };
  });

  return params;
};

const parseAllPaths = (paths: Record<string, Path>): Domains => {
  let opName = '';
  const domains: Domains = {};

  Object.entries(paths).forEach(([fullReqPath, pathData]) => {
    if (opName != pathData.groupName) {
      opName = pathData.groupName;

      const className = opName.replace(/(^.|[^a-zA-Z0-9]+(.))/g, (_, s, q) => (q || s).toUpperCase());
      domains[opName] = domains[opName] || {
        className,
        domainName: `${className}Domain`,
        paths: {},
        exports: new Map<string, string>(),
      };
    }

    const params = parsePathData(pathData, domains[opName].exports);

    domains[opName].paths[fullReqPath] = {
      templateFullPath: fullReqPath.replace(/[\$\{:]+([^\/\}:]+)\}?/, (_, s) => `\${testParams?.path?.${s} ?? path${ucFirst(s)}\}`),
      pathName: fullReqPath.replace(/[^a-zA-Z0-9]+(.?)/g, (_, s, i) => (i ? s.toUpperCase() : s)),
      params,
      methods: Object.keys(params),
    };
  });

  require('fs').writeFileSync('/tmp/data.json', JSON.stringify(domains, null, 2));

  return domains;
};

const getResponseExport = (method: string, name: string, schema: ParamResponse): string => {
  const validationText = SwaggerUtils.createJoiValidation(method, {
    parameters: [{ in: 'body', name, schema: (schema as Schema.Response).schema }],
  });

  return validationText.slice(validationText.indexOf(' ') + 1);
};

const getValidator = (validatorSchemas: string[]) => `\
export const validationSchemas: Record<string, Joi.ObjectSchema> = {
${validatorSchemas.join('\n')}
}

export const responseValidator = (responseKey: string, schema: Record<string, any>): Joi.ValidationResult => {
return validationSchemas[responseKey].validate(schema);
}`;

const buildMethodDataFile = (testData: TestData): { dataTemplate: string; stubTemplate: string; validatorSchema: string[] } => {
  const { method, data, domainSpec } = testData;
  const requestParts: string[] = [`.${method}(\`\${root}${data.templateFullPath}\`)`];
  const methodParams = data.params[method];

  if (methodParams.reqParams?.query) {
    const vars: string[] = Object.entries(methodParams.reqParams.query).map(([key, value]) => `${(value as Schema.Parameter).name}: ${key}`);
    requestParts.push(`.query(testParams?.query ?? { ${vars.join(', ')} })`);
  }

  if (methodParams.reqParams?.body) {
    const [name] = Object.keys(methodParams.reqParams.body);
    requestParts.push(`.send(testParams?.body ?? ${name})`);
  }

  const successCode = methodParams?.responses?.success as string;
  const successResponse = methodParams?.responses?.[successCode];
  const successSchema = (successResponse as Schema.Response)?.schema ?? successResponse;

  const responseName = `${data.pathName}${ucFirst(method)}`;
  const validatorSchema: string[] = [];

  Object.entries(methodParams.responses).forEach(([name, schema]) => {
    if (name === 'success') {
      return;
    }
    const varName = `${responseName}${name}`;
    validatorSchema.push(`  ${varName}: ${getResponseExport(method, varName, schema)}`);
    if (name === successCode) {
      validatorSchema.push(`  ${responseName}Success: ${getResponseExport(method, varName, schema)}`);
    }
  });

  if (validatorSchema?.length) {
    domainSpec.exports.set('responseValidator', 'true');
  }

  const testName = `${data.pathName}${ucFirst(method)}`;
  const statusCode = successCode || 200;

  const dataTemplate = `\
export const ${testName}: TestRequest = {
  specName: 'can ${method.toUpperCase()} ${testData.fullPath}',
  testKey: '${testName}',
  getPath: (testParams?: TestParams, root = baseUrl): string => \`\${root}${data.templateFullPath}\`,
  request: (testParams?: TestParams, root = baseUrl): supertest.Test =>
    request
      ${requestParts.join('\n      ')}
      .expect(({ status, body }) => {
        process.stderr.write(\`\n${testName}\n\${JSON.stringify({status, body}, null, 2)}\n\`);
        expect(status).toBe(${statusCode});
        expect(body).toBeDefined();${
          successSchema
            ? `
        expect(!responseValidator('${testName}${statusCode}', body).error).toBe(true);`
            : ''
        }
      }),
};`;

  const stubTemplate = `\
  it('can ${method.toUpperCase()} ${testData.fullPath}', async () => {
    const testData: TestData = {};
    await Test${domainSpec.domainName}.tests.${testName}.request(testData);
  });`;

  return { dataTemplate, stubTemplate, validatorSchema };
};

const importOrDefineJwt = (): string => {
  if (fs.existsSync('src/http/nodegen/interfaces/JwtAccess.ts')) {
    return `import { JwtAccess } from '@/http/nodegen/interfaces/JwtAccess';`;
  }

  return '\nexport type JwtAccess = Record<string, any>;';
};

const generateTestFile = (domainName: string, suiteBody: string[], imports = ''): string => `\
import { baseUrl, request, TestParams, TestRequest } from '@/http/nodegen/tests';
import * as supertest from 'supertest';
${imports ? imports + '\n' : ''}
${suiteBody.join('\n\n')}
`;

const generateIndexFile = (toImport: string[], toExport: string[]): string => `\
import app from '@/app';
import { HttpStatusCode } from '@/http/nodegen/errors';
import { NodegenRequest } from '@/http/nodegen/interfaces';
import { baseUrl as root } from '@/http/nodegen/routesImporter';
import { default as AccessTokenService } from '@/services/AccessTokenService';
import { NextFunction, Response } from 'express';
import { default as supertest } from 'supertest';
${toImport?.length ? toImport.sort().join('\n') : ''}
${importOrDefineJwt()}

export interface TestParams {
  query?: Record<string, any>;
  body?: Record<string, any>;
  path?: Record<string, any>;
  headers?: Record<string, any>;
  // form, other supertest stuff
}

export interface TestRequest {
  request(testParams?: TestParams): supertest.Test;
  getPath(testParams?: TestParams, baseUrl?: string): string;
  specName: string;
  testKey: string;
}

export type TestData = {};

export interface GeneratedTestDomain {
  tests: Record<string, TestRequest>;
  data?: Record<string, TestData>;
}

jest.mock('morgan', () => () => (req: NodegenRequest, res: Response, next: NextFunction) => next());

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
  afterEach: () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.resetAllMocks();
  },
  beforeEach: () => {
    mockAuth();
  },
};

export const defaultSetupTeardown = () => {
  beforeAll(setupTeardown.beforeAll);
  afterEach(setupTeardown.afterEach);
  beforeEach(setupTeardown.beforeEach);
};

export const mockAuth = (jwtData?: JwtAccess): JwtAccess => {
  const jwt: JwtAccess = jwtData ?? { subject: 'qxtest', dealerCode: '99999', userId: 1 };

  jest
    .spyOn(AccessTokenService, 'validateRequest')
    .mockImplementation((req: NodegenRequest, res: Response, next: NextFunction) => {
      req.jwtData = jwt;
      req.originalToken = 'gobledygoop';
      return next();
    });

  return jwt;
};

${toExport?.length ? toExport.join('\n') : ''}
`;

const generateTestStub = (domainSpec: DomainSpec, tests: string[]): boolean => {
  const outputPath = `src/domains/__tests__/${domainSpec.domainName}.api.spec.ts`;
  if (fs.existsSync(outputPath)) {
    return false;
  }
  fs.mkdirSync('src/domains/__tests__/', { recursive: true });

  const template = `\
import { defaultSetupTeardown, TestData, Test${domainSpec.domainName} } from '@/http/nodegen/tests';

defaultSetupTeardown();

describe('${domainSpec.domainName}', () => {
  beforeAll(async () => {
    // setup - run before suite (one time)
  });

  beforeEach(async () => {
    // setup - run before every test
  });

  afterEach(async () => {
    // teardown - run after every tests
  });

  afterAll(async () => {
    // teardown - run once after suite succeeds
  });

  ${tests.join('\n\n')}
});
`;

  createFile(outputPath, template);

  return true;
}

const mapKeys = (map: Map<any, any>) => Array.from(map, ([key]) => key);

const mapValues = (map: Map<any, any>) => Array.from(map, ([_, value]) => value);

const createFile = (path: string, data: string) => fs.writeFileSync(path, prettier(data, '.ts'));

const writeTestDataFile = (path: string, domainSpec: DomainSpec, validatorSchemas: string[]) => {
  const dataExports: string[] = mapValues(domainSpec.exports);
  if (validatorSchemas?.length) {
    dataExports.unshift(`import * as Joi from 'joi';`);
    dataExports.push(getValidator(validatorSchemas));
  }
  createFile(path, dataExports.join('\n\n'));
};

const buildSpecFiles = (ctx: Context): void => {
  const domains = parseAllPaths(ctx.swagger.paths);

  const indexImports: string[] = [];
  const indexExports: string[] = [];

  Object.entries(domains).forEach(([opName, domainSpec]) => {
    const specFileName = `${domainSpec.domainName}`;
    const exportables = [`tests: ${specFileName}Tests`];
    const dataTemplates: string[] = [];
    const stubTemplates: string[] = [];
    const validatorSchemas: string[] = [];

    Object.entries(domainSpec.paths).forEach(([fullPath, data]) => {
      data.methods.forEach((method) => {
        const { dataTemplate, stubTemplate, validatorSchema } = buildMethodDataFile({ fullPath, method, data, domainSpec });
        dataTemplates.push(dataTemplate);
        stubTemplates.push(stubTemplate);
        validatorSchemas.push(...validatorSchema);
      });
    });

    if (domainSpec.exports.size > 0) {
      writeTestDataFile(`${ctx.dest}/${specFileName}.data.ts`, domainSpec, validatorSchemas);
      exportables.push(`data: ${specFileName}Data`);

      indexImports.push(`import * as ${specFileName}Data from './${specFileName}.data';`);
    }

    indexImports.push(`import * as ${specFileName}Tests from './${specFileName}';`);
    indexExports.push(`export const Test${specFileName}: GeneratedTestDomain = { ${exportables.join(', ')} };`);

    const importString = domainSpec.exports.size
      ? `import { ${mapKeys(domainSpec.exports).sort().join(', ')} } from './${specFileName}.data';`
      : null;
    createFile(`${ctx.dest}/${specFileName}.ts`, generateTestFile(domainSpec.domainName, dataTemplates, importString));

    generateTestStub(domainSpec, stubTemplates);
  });

  createFile(`${ctx.dest}/index.ts`, generateIndexFile(indexImports, indexExports));
};

export default buildSpecFiles;
