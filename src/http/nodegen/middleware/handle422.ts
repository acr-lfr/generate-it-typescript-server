import http422 from '../errors/422';
import express = require('express');

import NodegenRequest from '../../interfaces/NodegenRequest';

/**
 * Required for if an unprocessable response should be thrown from a domain or controller
 * Read: ../errors/422.ts
 * @returns {Function}
 */
export default () => {
console.warn(
    `Deprecation warning: handle422() and the 422.ts error will be removed from the codebase in the future.
Please use UnprocessableException and allow it to be caught by the handleHttpException.ts
`)
  return (err: any, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    if (err instanceof http422) {
      res.status(422).json({ message: err.message || 'Unprocessable' });
    } else {
      next(err);
    }
  }
}
