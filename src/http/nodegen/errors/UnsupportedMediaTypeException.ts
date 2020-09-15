import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class UnsupportedMediaTypeException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.UNSUPPORTED_MEDIA_TYPE, message);
    Object.setPrototypeOf(this, UnsupportedMediaTypeException.prototype);
  }
}
