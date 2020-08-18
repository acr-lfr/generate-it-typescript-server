import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class NotAcceptableException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.NOT_ACCEPTABLE, message);
    Object.setPrototypeOf(this, NotAcceptableException.prototype);
  }
}
