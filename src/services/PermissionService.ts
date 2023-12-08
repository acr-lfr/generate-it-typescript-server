import NodegenRequest from '@/http/interfaces/NodegenRequest';
import express from 'express';
// import { ForbiddenException } from '@/http/nodegen/errors';

class PermissionService {
  middleware(req: NodegenRequest, res: express.Response, next: express.NextFunction, permission: string) {
    // Please inject your own logic here, below is a very crude and simple example.
    /**
     * This will never be overridden.
     * If the swagger path contains x-permission this middleware is used.
     * For example, assuming the object appRole was a key value object where each key was a
     * role name and each value was an array of permissions (eg from a redis db or similar) this could be a solution:
     * if(appRole[req.jwtData.role].contains(permission)) {
     *   next();
     * }
     * throw new ForbiddenException('Your user does not have permission to do that');
     */
    next();
  }
}
export default new PermissionService();
