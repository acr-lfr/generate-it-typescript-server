import { HttpStatusMessage } from '@/http/nodegen/errors';

export class HttpException extends Error {
  public status: number;
  public message: string;
  public body: string | Record<string, any>;

  constructor(status: number, body?: string | Record<string, any>) {
    super();
    this.name = 'HttpException';
    this.status = status;
    this.message = HttpStatusMessage[status];
    this.body = body || this.message;

    // https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-extending-built-ins-like-error-array-and-map-work
    Object.setPrototypeOf(this, HttpException.prototype);
  }
}
