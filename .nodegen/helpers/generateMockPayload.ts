import { mockItGenerator } from 'generate-it-mockers';
import { BaseSchema, Operation, Parameter, Path } from 'swagger-schema-official';

interface MappedParams {
  params: Record<string, BaseSchema[]>;
  exports: string;
  imports: string;
}

interface NodegenOp extends Operation {
  path?: Path;
  path_name?: string;
}

type PathMethodParams = Record<string, Record<string, Record<string, BaseSchema[]>>>;

type Output = {
  exports: string;
  imports: string;
  params: PathMethodParams
};

/*
imports: '...',
exports: '...',
'/filter': {
  '/get': {
    params: {
      query: [
        {
          'in': 'query',
          'name': 'page',
          'type': 'number',
          'description': 'Pagination offset (1-indexed)',
          'x-example': 1,
        },
        {
          'in': 'query',
          'name': 'perPage',
          'type': 'number',
          'description': 'Pagination size',
          'x-example': 10,
        },
      ],
    },
  }
}
 */

/*
 * Output ts variables for tests, turning params into payload variables
 */
export default (operations: NodegenOp[]): Output => {
  let allExports: Map<string, string> = new Map();

  const data: PathMethodParams = {};

  for (const op of operations) {
    Object.entries(op.path).forEach(([method, path]) => {
      const mapped = mapOperation(method as keyof Path, path, allExports);
      if (mapped) {
        data[op.path_name] = data[op.path_name] || {};
        data[op.path_name][method] = mapped;
      }
    });
  }

  return {
    params: data,
    imports: `import { ${[...allExports.keys()].join(', ')} } from '@/http/nodegen/tests';`,
    exports: [...allExports.values()].join('\n'),
  };
};

export const mapOperation = (
  method: keyof Path,
  op: Operation,
  exported: Map<string, string>,
): Record<string, BaseSchema[]> => {
  if (!['put', 'post', 'patch', 'get', 'delete'].includes(method?.toLowerCase?.())) {
    return null;
  }

  const params: Record<string, BaseSchema[]> = {};

  op.parameters?.forEach?.((param: Parameter) => {
    const toGenerate = param.in === 'body' ? param.schema : param;
    params[param.in] = (params[param.in] || []).concat(toGenerate);

    let exportName = param.name;
    if (param.in !== 'body' || !exportName) {
      exportName = `${param.in}${param.name.charAt(0).toUpperCase()}${param.name.slice(1)}`;
    }
    exported.set(exportName, `export const ${exportName} = ${JSON.stringify(mockItGenerator(toGenerate))};`);
  });

  return params;
};
