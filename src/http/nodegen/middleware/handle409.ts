import http409 from '../errors/409';
import express = require('express');

import NodegenRequest from '../../interfaces/NodegenRequest';

/**
 * Required for if an unauthorised response should be thrown from a domain or controller
 * Read: ../errors/409.ts
 * @returns {Function}
 */
export default () => {
console.warn(
    `Deprecation warning: handle409() and the 409.ts error will be removed from the codebase in the future.
Please use ConflictException and allow it to be caught by the handleHttpException.ts
`)
  return (err: any, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    if (err instanceof http409) {
      res.status(409).send();
    } else {
      next(err);
    }
  };
}
