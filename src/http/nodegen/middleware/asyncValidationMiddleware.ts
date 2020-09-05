import express = require('express');
import NodegenRequest from '../../interfaces/NodegenRequest';
import AsyncValidationService from '@/services/AsyncValidationService';

/**
 * Async functions called before hitting a domains layer.
 * To use, add an x-async-validator attribute to a path object containing
 * a string[] representing methods from the src/service/AsyncValidationService.ts
 * The async function will only call next after the async action has completed
 * @returns {Function}
 */
export default (asyncValidators: string[]) => {
  return (req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    AsyncValidationService.middleware(req, res, next, asyncValidators);
  };
}
