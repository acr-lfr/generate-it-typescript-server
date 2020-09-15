import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class InternalServerErrorException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.INTERNAL_SERVER_ERROR, message);
    Object.setPrototypeOf(this, InternalServerErrorException.prototype);
  }
}
