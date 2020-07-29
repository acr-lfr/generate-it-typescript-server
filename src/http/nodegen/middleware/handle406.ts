import express = require('express');
import http406 from '../errors/406';

import NodegenRequest from '../../interfaces/NodegenRequest';

/**
 * Required for if an unauthorised response should be thrown from a domain or controller
 * Read: ../errors/403.ts
 * @returns {Function}
 */
export default () => {
  return (err: any, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    if (err instanceof http406) {
      res.status(406).send()
    } else {
      next(err)
    }
  }
}
