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

  const parseValidators = async (req: NodegenRequest, asyncValidators: string[]) => {
    for (let i = 0; i < asyncValidators.length; ++i) {
      const asyncValidatorParts = asyncValidators[i].split(':');
      const methodToCall = String(asyncValidatorParts.shift());
      // It is expected the custom async validation method will throw its own http errors
      // @ts-ignore
      if (!AsyncValidationService[methodToCall]) {
        throw new Error(`Unknown AsyncValidationService method function received from the openapi file: ` + methodToCall);
      }
      // @ts-ignore
      await AsyncValidationService[methodToCall](req, asyncValidatorParts);
    }
  };

  return (req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    return parseValidators(req, asyncValidators).then(() => next()).catch(e => next(e));
  };
}
