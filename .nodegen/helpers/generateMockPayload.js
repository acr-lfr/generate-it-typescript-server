"use strict";
exports.__esModule = true;
exports.mapOperation = void 0;
var tslib_1 = require("tslib");
var generate_it_mockers_1 = require("generate-it-mockers");
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
exports["default"] = (function (operations) {
    var e_1, _a;
    var allExports = new Map();
    var data = {};
    var _loop_1 = function (op) {
        Object.entries(op.path).forEach(function (_a) {
            var _b = tslib_1.__read(_a, 2), method = _b[0], path = _b[1];
            var mapped = exports.mapOperation(method, path, allExports);
            if (mapped) {
                data[op.path_name] = data[op.path_name] || {};
                data[op.path_name][method] = mapped;
            }
        });
    };
    try {
        for (var operations_1 = tslib_1.__values(operations), operations_1_1 = operations_1.next(); !operations_1_1.done; operations_1_1 = operations_1.next()) {
            var op = operations_1_1.value;
            _loop_1(op);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (operations_1_1 && !operations_1_1.done && (_a = operations_1["return"])) _a.call(operations_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return {
        params: data,
        imports: "import { " + tslib_1.__spread(allExports.keys()).join(', ') + " } from '@/http/nodegen/tests';",
        exports: tslib_1.__spread(allExports.values()).join('\n')
    };
});
var mapOperation = function (method, op, exported) {
    var _a, _b, _c;
    if (!['put', 'post', 'patch', 'get', 'delete'].includes((_a = method === null || method === void 0 ? void 0 : method.toLowerCase) === null || _a === void 0 ? void 0 : _a.call(method))) {
        return null;
    }
    var params = {};
    (_c = (_b = op.parameters) === null || _b === void 0 ? void 0 : _b.forEach) === null || _c === void 0 ? void 0 : _c.call(_b, function (param) {
        var toGenerate = param["in"] === 'body' ? param.schema : param;
        params[param["in"]] = (params[param["in"]] || []).concat(toGenerate);
        var exportName = param.name;
        if (param["in"] !== 'body' || !exportName) {
            exportName = "" + param["in"] + param.name.charAt(0).toUpperCase() + param.name.slice(1);
        }
        exported.set(exportName, "export const " + exportName + " = " + JSON.stringify(generate_it_mockers_1.mockItGenerator(toGenerate)) + ";");
    });
    return params;
};
exports.mapOperation = mapOperation;
