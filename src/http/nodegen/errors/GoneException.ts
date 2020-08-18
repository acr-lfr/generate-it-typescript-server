import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class GoneException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.GONE, message);
    Object.setPrototypeOf(this, GoneException.prototype);
  }
}
