import http423 from '../errors/423';

import NodegenRequest from '../../interfaces/NodegenRequest';
import express = require('express');

/**
 * Required for if an unauthorised response should be thrown from a domain or controller
 * Read: ../errors/423.ts
 * @returns {Function}
 */
export default () => {
console.warn(
    `Deprecation warning: handle423() and the 423.ts error will be removed from the codebase in the future.
Please use LockedException and allow it to be caught by the handleHttpException.ts
`)
  return (err: any, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    if (err instanceof http423) {
      res.status(423).send();
    } else {
      next(err);
    }
  };
}
