import { HttpStatusMessage } from '@/http/nodegen/errors';
import { formatException } from '@/http/nodegen/utils/formatException';

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
    return this.rawBody;
  }

  set body(body: string | Record<string, any>) {
    this.rawBody = body;
    const format = formatException(this);
    this.rawBody = format === this ? this.toJSON() : format;
  }

  isJson() {
    return typeof this.body !== 'string';
  }

  toJSON() {
    return {
      name: this.name,
      status: this.status,
      message: this.message,
      body: this.rawBody,
    }
  }
}
