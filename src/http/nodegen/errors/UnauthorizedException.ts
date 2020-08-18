import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class UnauthorizedException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.UNAUTHORIZED, message);
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}
