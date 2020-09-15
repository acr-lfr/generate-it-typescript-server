import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class NotFoundException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.NOT_FOUND, message);
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}
