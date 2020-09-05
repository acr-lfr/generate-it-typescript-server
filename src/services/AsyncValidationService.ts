import NodegenRequest from '@/http/interfaces/NodegenRequest';
import express = require('express');

class AsyncValidationService {
  /**
   *
   * @param req
   * @param res
   * @param next
   * @param asyncValidators
   */
  middleware (req: NodegenRequest, res: express.Response, next: express.NextFunction, asyncValidators: string[]) {
    for (let i = 0; i < asyncValidators.length; ++i) {
      const asyncValidatorParts = asyncValidators[i].split(':');
      const methodToCall = String(asyncValidatorParts.shift());
      // It is expected the custom async validation method will throw its own http errors
      // @ts-ignore
      this[methodToCall](req, asyncValidatorParts).then(() => {
        next();
      }).catch((e: any) => {
        throw e;
      });
    }
  }

  /**
   * EXMAPLE ONLY
   * @param req
   * @param asyncValidatorParams
   */
  async uniqueUsername (req: NodegenRequest, asyncValidatorParams: string[]): Promise<void> {
    /**
     * const user = db.user.find({ username: req.body.username })
     * if(user){
     *   throw http422()
     * }
     */
  }
}

export default new AsyncValidationService();
