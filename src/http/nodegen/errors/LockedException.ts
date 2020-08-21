import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class LockedException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.LOCKED, message);
    Object.setPrototypeOf(this, LockedException.prototype);
  }
}
