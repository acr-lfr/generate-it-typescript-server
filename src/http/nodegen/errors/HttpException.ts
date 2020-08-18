import { HttpStatusMessage } from './http-status.enum';
import { HttpErrorsService } from '@/services/HttpErrorsService';

export class HttpException extends Error {
  public status: number;
  private rawBody: string | Record<string, any>;

  constructor(status: number, body?: string | Record<string, any>) {
    super();
    this.name = 'HttpException';
    this.status = status;
    this.message = HttpStatusMessage[status];
    this.body = body || this.message;

    // https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-extending-built-ins-like-error-array-and-map-work
    Object.setPrototypeOf(this, HttpException.prototype);
  }

  get body(): string | Record<string, any> {
    return HttpErrorsService.formatException(this);
  }

  set body(body: string | Record<string, any>) {
    this.rawBody = body;
  }

  isJson() {
    return typeof this.body !== 'string';
  }
}
