import express = require('express');

import NodegenRequest from '../../interfaces/NodegenRequest';
import AsyncValidationService from '@/services/AsyncValidationService';

/**
 * Express middleware to control the http headers for caching only
 * @returns {Function}
 */
export default (asyncValidators: string[]) => {
  return (req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    AsyncValidationService.middleware(req, res, next, asyncValidators);
  };
}
