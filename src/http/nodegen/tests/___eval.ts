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
  pathInterface?: string;
  usesWorkers?: boolean;
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
  imports: Map<string, string>;
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

const mapKeys = (map: Map<any, any>) => Array.from(map, ([key]) => key);

const mapValues = (map: Map<any, any>) => Array.from(map, ([_, value]) => value);

const createFormattedFile = async (path: string, data: string) => {
  try {
    const formattedData = await Promise.resolve(
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

    fs.writeFileSync(path, formattedData);
  } catch (e) {
    console.error(`Error formatting ${path} - writing unformatted data instead`);
    fs.writeFileSync(path, data);
  }
};

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
      exportData.set(varName, `export const ${varName} = mockItGenerator(${JSON.stringify(paramDef?.schema || paramDef)});`);
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
      pathInterface: reqData?.['x-request-definitions']?.path?.name,
      usesWorkers: !!reqData?.['x-worker'],
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
        imports: new Map<string, string>(),
        securityDefinitions: spec.securityDefinitions || spec.components?.securitySchemes,
      };
    }

    const params = parsePathData(pathData, domains[opName].exports);

    domains[opName].paths[fullReqPath] = {
      templateFullPath: fullReqPath.replace(/[\$\{:]+([^\/\}:]+)\}?/g, (_, s) => `\${${s}\}`),
      pathName: camelCase(fullReqPath),
      params,
      methods: Object.keys(params),
    };
  });

  return domains;
};

const getResponseExport = (schema: ParamResponse): string => {
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
  const methodParams = data.params[method];

  const pathParams: { name: string; type: string }[] = Object.values(methodParams.reqParams?.path || {})
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name }) => ({ name, type: `${methodParams?.pathInterface}['${name}']` }), []);

  const setHeaders: string[] = [];
  const queryVars: string[] = [];
  const requestParts: string[] = [`.${method}(\`\${baseUrl}${data.templateFullPath}\`)`];

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
    requestParts.push(`.send(${name})`);
  } else if (methodParams.reqParams?.formData) {
    const [name] = Object.keys(methodParams.reqParams.formData);
    requestParts.push(`.attach('${methodParams.reqParams.formData[name].name}', ${name}, '${name}.png')`);
  }

  if (methodParams.reqParams?.header) {
    Object.entries(methodParams.reqParams?.header).forEach(([importVar, { name }]) => {
      setHeaders.push(`'${name}': ${importVar}`);
    });
  }

  // build auth header
  methodParams.security?.forEach?.((security) => {
    Object.entries(security).forEach(([name]) => {
      const def = domainSpec.securityDefinitions?.[name];

      switch (def?.type) {
        case 'http':
          setHeaders.push(`'Authorization': '${ucFirst(def.scheme || 'basic')} base64string'`);
          break;
        case 'basic':
          setHeaders.push(`'Authorization': 'Basic base64string'`);
          break;
        case 'apiKey':
          if (def.in === 'query') {
            queryVars.push(`'${def.name}': 'apiKey'`);
          } else {
            setHeaders.push(`'${def.name}': 'apiKey'`);
          }
          break;
        case 'oauth2': // TODO
        case 'openIdConnect':
          queryVars.push(`${def.type}: 'TODO'`);
          break;
      }
    });
  });

  if (setHeaders.length) {
    requestParts.push(`.set({ ${setHeaders.join(', ')} })`);
  }

  if (queryVars?.length) {
    requestParts.push(`.query({ ${queryVars.join(', ')} })`);
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
    const responseValidator = getResponseExport(schema);

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

  pathParams.push({ name: 'root', type: 'string = baseUrl' });

  let pathArgs = pathParams.map(({ name, type }) => `${name}: ${type}`);

  if (methodParams?.pathInterface) {
    domainSpec.imports.set(methodParams?.pathInterface, '@/http/nodegen/interfaces');
  }

  const dataTemplate = `\
  // ${responseName}
  //
  public static ${responseName}Path(${pathArgs}): string {
    return \`\${root}${data.templateFullPath}\`;
  }

  public static ${responseName}(${pathArgs}): supertest.Test {
    return request.${method}(this.${responseName}Path(${pathParams.map((p) => p.name).join(', ')}));
  }`;

  const statusCode = successCode || 200;

  const stubTemplate = `\
  it('can ${method.toUpperCase()} ${testData.fullPath}', async () => {
    await request
      ${requestParts.join('\n      ')}
      .expect(({ status, ${responseKey} }) => {
        expect(status).toBe(${statusCode});
        ${
          successSchema
            ? `
        const validated = responseValidator('${responseName}${statusCode}', ${responseKey});
        expect(validated.error).toBe(undefined);`
            : ''
        }
      });
  });`;

  return { dataTemplate, stubTemplate, validatorSchema };
};

const writeTestHelperFile = async (filename: string, domainName: string, classBody: string[], imports = ''): Promise<void> => {
  const content = `\
${imports ? imports + '\n' : ''}\
import { baseUrl, request } from '@/http/nodegen/tests';
import * as supertest from 'supertest';

export class Test${domainName} {
${classBody.join('\n\n')}
}
`;
  await createFormattedFile(filename, content);
};

const writeTestIndexFile = (filename: string, toExport: string[], usesWorkers: boolean = false): void => {
  const content = `\
import app from '@/app';
import { NodegenRequest } from '@/http/nodegen/interfaces';
${usesWorkers ? `import { default as WorkerService } from '@/http/nodegen/request-worker/WorkerService';\n` : ''}\
import { baseUrl as root } from '@/http/nodegen/routesImporter';
import { default as AccessTokenService } from '@/services/AccessTokenService';
import { NextFunction, RequestHandler, Response } from 'express';
import { default as supertest } from 'supertest';

// sucks these can't be on-demand - jest needs to hoist them so that anything importing them gets the mock.
jest.mock('morgan', () => () => (req: NodegenRequest, res: Response, next: NextFunction) => next());
jest.mock('@/http/nodegen/middleware/asyncValidationMiddleware', () => () => (req: NodegenRequest, res: Response, next: NextFunction) => next());

export const baseUrl = root.replace(/\\/*$/, '');
export let request: supertest.SuperTest<supertest.Test>;

// don't call twice...
let setupCalled = false;

export const defaultSetupTeardown = () => {
  if (setupCalled) {
    return;
  }
  setupCalled = true;

  beforeAll(async () => {
    request = supertest((await app(0)).expressApp);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  ${
    usesWorkers
      ? `afterAll(async () => {
    await WorkerService.close();
  });\n`
      : ''
  }\
};

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
export const mockAuth = (middleware?: RequestHandler) => {
  jest
    .spyOn(AccessTokenService, 'validateRequest')
    .mockImplementation(
      middleware ||
        ((req: NodegenRequest, res: Response, next: NextFunction) => next())
    );
};

${toExport?.length ? toExport.join('\n') : ''}
`;

  fs.writeFileSync(filename, content);
};

const writeTestStubFile = async (basePath: string, domainSpec: DomainSpec, tests: string[], useAuth?: boolean, importString?: string): Promise<boolean> => {
  basePath = basePath.replace(/\/+$/, '');

  const outputPath = `${basePath}/${domainSpec.domainName}.api.spec.ts`;
  if (fs.existsSync(outputPath)) {
    return false;
  }
  fs.mkdirSync(basePath, { recursive: true });

  const template = `\
import { baseUrl, defaultSetupTeardown,${useAuth ? 'mockAuth,' : ''} request } from '@/http/nodegen/tests';
${importString ? importString + '\n' : ''}\

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

  await createFormattedFile(outputPath, template);

  return true;
};

const getValidator = (validatorSchemas: string[]) => `\
export const validationSchemas: Record<string, Joi.AnySchema> = {
${validatorSchemas.join('\n')}
}

/**
 * Default, basic validator which checks if the schema returned matches
 * the schema defined in the API spec.
 * This is just a starting point for the tests, but this should be replaced by more specific,
 * targeted test cases.
 *
 * @param {string}  responseKey  The response key
 * @param {any}     schema       The schema
 */
export const responseValidator = (responseKey: string, schema: any): { error?: Joi.ValidationError } => {
  return validationSchemas[responseKey].validate(schema);
}`;

const writeTestDataFile = async (path: string, domainSpec: DomainSpec, validatorSchemas: string[]): Promise<void> => {
  const dataExports: string[] = mapValues(domainSpec.exports).filter((key) => key !== 'true');
  if (validatorSchemas?.length) {
    dataExports.unshift(`import * as Joi from 'joi';\nimport { mockItGenerator } from 'generate-it-mockers';`);
    dataExports.push(getValidator(validatorSchemas));
  }
  await createFormattedFile(path, dataExports.join('\n\n'));
};

const getImports = (domainSpec: DomainSpec, specFileName: string): { helper: string; stub: string } => {
  let helper: string = null;
  if (domainSpec.imports.size) {
    const importLines = Array.from(domainSpec.imports).reduce(
      (imports: Record<string, string[]>, [importName, importFile]) => ({
        ...imports,
        [importFile]: [...(imports[importFile] || []), importName],
      }),
      {}
    );
    helper = Object.entries(importLines).reduce((all, [file, names]) => all + `import { ${names.sort().join(', ')} } from '${file}';`, '');
  }

  const stub = domainSpec.exports.size
    ? `import { ${mapKeys(domainSpec.exports)
        .map((name) => name.replace(/^path([A-Z])/, (_: string, l: string) => `${name} as ${l.toLowerCase()}`))
        .sort()
        .join(', ')} } from '@/http/nodegen/tests/${specFileName}.data';`
    : null;

  return { helper, stub };
};

const buildSpecFiles = async (ctx: Context): Promise<void> => {
  if (!ctx.nodegenRc?.helpers?.tests) {
    return;
  }

  const indexExports: string[] = [];
  const domains = parseAllPaths(ctx.swagger);
  let domainUsesWorkers = false;

  Object.entries(domains).forEach(([opName, domainSpec]) => {
    const specFileName = `${domainSpec.domainName}`;
    const dataTemplates: string[] = [];
    const stubTemplates: string[] = [];
    const validatorSchemas: string[] = [];
    let useAuth: boolean = false;

    indexExports.push(`export { Test${specFileName} } from './${specFileName}';`);

    Object.entries(domainSpec.paths).forEach(([fullPath, data]) => {
      data.methods.forEach((method) => {
        const { dataTemplate, stubTemplate, validatorSchema } = buildMethodDataFile({
          fullPath,
          method,
          data,
          domainSpec,
        });

        dataTemplates.push(dataTemplate);
        stubTemplates.push(stubTemplate);
        validatorSchemas.push(...validatorSchema);
        useAuth = useAuth || !!data.params[method]?.security?.length;
        domainUsesWorkers = domainUsesWorkers || !!data.params[method]?.usesWorkers;
      });
    });

    const domainImports = getImports(domainSpec, specFileName);
    const testOutput = path.join(ctx.targetDir, ctx.nodegenRc?.helpers?.tests?.outDir || 'src/domains/__tests__');

    if (domainSpec.exports.size > 0) {
      await writeTestDataFile(`${ctx.dest}/${specFileName}.data.ts`, domainSpec, validatorSchemas);
    }

    await writeTestHelperFile(`${ctx.dest}/${specFileName}.ts`, domainSpec.domainName, dataTemplates, domainImports.helper);
    await writeTestStubFile(testOutput, domainSpec, stubTemplates, useAuth, domainImports.stub);
  });

  writeTestIndexFile(`${ctx.dest}/index.ts`, indexExports, domainUsesWorkers);
};

export default buildSpecFiles;
