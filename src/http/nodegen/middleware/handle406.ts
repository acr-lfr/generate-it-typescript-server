import express = require('express');
import http406 from '../errors/406';

import NodegenRequest from '../../interfaces/NodegenRequest';

/**
 * Required for if an not acceptable response should be thrown from a domain or controller
 * Read: ../errors/406.ts
 * @returns {Function}
 */
export default () => {
console.warn(
    `Deprecation warning: handle406() and the 406.ts error will be removed from the codebase in the future.
Please use NotAcceptableException and allow it to be caught by the handleHttpException.ts
`)
  return (err: any, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    if (err instanceof http406) {
      res.status(406).send()
    } else {
      next(err)
    }
  }
}
