import express = require('express');
import http401 from '../errors/401'

import NodegenRequest from '../../interfaces/NodegenRequest'

/**
 * Required for if an unauthorised response should be thrown from a domain or controller
 * Read: ../errors/401.ts
 * @returns {Function}
 */
export default () => {
console.warn(
`Deprecation warning: handle401() and the 401.ts error will be removed from the codebase in the future.
Please use UnauthorizedException and allow it to be caught by the handleHttpException.ts
`)
  return (err: any, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    if (err instanceof http401) {
      res.status(401).send()
    } else {
      next(err)
    }
  }
}
