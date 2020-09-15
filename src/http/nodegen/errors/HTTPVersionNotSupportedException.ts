import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class HTTPVersionNotSupportedException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.HTTP_VERSION_NOT_SUPPORTED, message);
    Object.setPrototypeOf(this, HTTPVersionNotSupportedException.prototype);
  }
}
