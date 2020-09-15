import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class PreconditionFailedException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.PRECONDITION_FAILED, message);
    Object.setPrototypeOf(this, PreconditionFailedException.prototype);
  }
}
