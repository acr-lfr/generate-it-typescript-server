import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class ForbiddenException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.FORBIDDEN, message);
    Object.setPrototypeOf(this, ForbiddenException.prototype);
  }
}
