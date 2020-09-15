import express = require('express');
import http403 from '../errors/403';

import NodegenRequest from '../../interfaces/NodegenRequest';

/**
 * Required for if an forbidden response should be thrown from a domain or controller
 * Read: ../errors/403.ts
 * @returns {Function}
 */
export default () => {
console.warn(
    `Deprecation warning: handle403() and the 403.ts error will be removed from the codebase in the future.
Please use ForbiddenException and allow it to be caught by the handleHttpException.ts
`)
  return (err: any, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    if (err instanceof http403) {
      res.status(403).send()
    } else {
      next(err)
    }
  }
}
