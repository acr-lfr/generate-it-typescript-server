import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class ConflictException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.CONFLICT, message);
    Object.setPrototypeOf(this, ConflictException.prototype);
  }
}
