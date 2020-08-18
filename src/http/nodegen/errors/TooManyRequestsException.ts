import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class TooManyRequestsException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.TOO_MANY_REQUESTS, message);
    Object.setPrototypeOf(this, TooManyRequestsException.prototype);
  }
}
