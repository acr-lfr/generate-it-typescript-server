import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class NotImplementedException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.NOT_IMPLEMENTED, message);
    Object.setPrototypeOf(this, NotImplementedException.prototype);
  }
}
