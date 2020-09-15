import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class ImATeapotException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.I_AM_A_TEAPOT, message);
    Object.setPrototypeOf(this, ImATeapotException.prototype);
  }
}
