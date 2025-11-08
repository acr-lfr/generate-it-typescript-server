import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class PaymentRequiredException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.PAYMENT_REQUIRED, message);
    Object.setPrototypeOf(this, PaymentRequiredException.prototype);
  }
}
