import NodegenRequest from '@/http/interfaces/NodegenRequest';

class AsyncValidationService {
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
