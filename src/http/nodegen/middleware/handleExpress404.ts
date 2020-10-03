import express = require('express');
import { NodegenRequest } from '@/http/nodegen/interfaces';
import { NotFoundException } from '@/http/nodegen/errors';

/**
 * Default 404 handler for the express app
 */
export default () => {
  return (req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    return next(new NotFoundException('Route not found'));
  };
}
