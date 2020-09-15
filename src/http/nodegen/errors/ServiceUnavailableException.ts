import { HttpStatusCode } from './http-status.enum';
import { HttpException } from './HttpException';

export class ServiceUnavailableException extends HttpException {
  constructor(message?: string | { [key: string]: any }) {
    super(HttpStatusCode.SERVICE_UNAVAILABLE, message);
    Object.setPrototypeOf(this, ServiceUnavailableException.prototype);
  }
}
