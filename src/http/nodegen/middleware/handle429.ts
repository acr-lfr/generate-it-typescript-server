import http429 from '../errors/429';

import NodegenRequest from '../../interfaces/NodegenRequest';
import express = require('express');

/**
 * Required for if an too many request response should be thrown from a domain or controller
 * Read: ../errors/429.ts
 * @returns {Function}
 */
export default () => {
console.warn(
    `Deprecation warning: handle429() and the 429.ts error will be removed from the codebase in the future.
Please use TooManyRequestsException and allow it to be caught by the handleHttpException.ts
`)
  return (err: any, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    if (err instanceof http429) {
      res.status(429).send();
    } else {
      next(err);
    }
  };
}
