import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class UnprocessableEntityException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.UNPROCESSABLE_ENTITY, message);
    Object.setPrototypeOf(this, UnprocessableEntityException.prototype);
  }
}
