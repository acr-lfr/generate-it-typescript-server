import { HttpException } from '@/http/nodegen/errors';

export class HttpErrorsService {
  /**
   * Parse and format HTTP errors
   *
   * By default the exception body is returned - just replace the body of the
   * function to return whatever you like.
   *
   * eg: return `${exception.status} ${exception.message}: ${exception.stack}`;
   */
  public static formatException(exception: HttpException): string | Record<string, any> {
    return exception;
  }

  /**
   * Figure out which response type to send based on accept header
   * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept
   *
   * @param  {string}  accept  The accept header
   * @param  {string}  mimes   Our desired response types (in order)
   *
   * @return {string}  If the accept header contains something we woudl like to
   *                   send, it will be returned
   */
  public getPreferredResponseFormat(accept: string, mimes: string[]): string {
    accept = accept.replace(/^[Aa]ccept\s*:\s*/, '');

    const priority: string[][] = accept.split(/\s*,\s*/).reduce((acc, val) => {
      const [mime, prio] = val.split(';');
      const prioValue = (prio || '1').replace(/.*=\s*/, '');
      const index = 10 - Math.round(parseFloat(prioValue) * 10);
      acc[index] = (acc[index] || []).concat(mime);

      return acc;
    }, []);

    mimes.unshift('*/*');

    const parts = mimes.map(mime => {
      const [type, subtype] = mime.split('/');
      if (!subtype) {
        return type.replace(/\*/g, '\\*');
      }

      console.log({ type, subtype, reg: `${type}\/(${subtype}|\*)` });

      return `${type}\/(${subtype}|*)`.replace(/\*/g, '\\*');
    });

    const willAccept = new RegExp(parts.join('|'));

    const preference = priority.find(mimeTypes => mimeTypes.find(mime => willAccept.test(mime)));

    return preference?.[0];
  }
}
