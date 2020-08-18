import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class GatewayTimeoutException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.GATEWAY_TIMEOUT, message);
    Object.setPrototypeOf(this, GatewayTimeoutException.prototype);
  }
}
