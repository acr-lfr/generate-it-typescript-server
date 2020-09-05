import express from 'express';
import NodegenRequest from '@/http/interfaces/NodegenRequest';

class AsyncValidationService {
  /**
   * Entry function for the src/http/nodegen/middleware/asyncValidationMiddleware.ts
   */
  middleware (req: NodegenRequest, res: express.Response, next: express.NextFunction, asyncValidators: string[]) {
    this.parseValidators(req, asyncValidators).then(() => {
      next();
    }).catch((e) => {
      throw next(e);
    });
  }

  async parseValidators (req: NodegenRequest, asyncValidators: string[]) {
    for (let i = 0; i < asyncValidators.length; ++i) {
      const asyncValidatorParts = asyncValidators[i].split(':');
      const methodToCall = String(asyncValidatorParts.shift());
      // It is expected the custom async validation method will throw its own http errors
      // @ts-ignore
      if (!this[methodToCall]) {
        throw new Error('Unknown async function called: ' + methodToCall);
      }
      // @ts-ignore
      await this[methodToCall](req, asyncValidatorParts);
    }
  }

  /**
   * EXAMPLE ONLY
   * @param req
   * @param asyncValidatorParams
   */
  async uniqueUsername (req: NodegenRequest, asyncValidatorParams: string[]): Promise<void> {
    /**
     * // Run the async function and throw the required error when needed
     * const user = await db.user.find({ username: req.body.username })
     * if(user){
     *   throw http422()
     * }
     */
  }
}

export default new AsyncValidationService();
