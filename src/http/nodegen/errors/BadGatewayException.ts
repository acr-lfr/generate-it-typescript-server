import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class BadGatewayException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.BAD_GATEWAY, message);
    Object.setPrototypeOf(this, BadGatewayException.prototype);
  }
}
