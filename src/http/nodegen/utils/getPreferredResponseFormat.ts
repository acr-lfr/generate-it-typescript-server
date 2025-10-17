import { NotAcceptableException } from '@/http/nodegen/errors';

/**
 * Figure out which response type to send based on accept header
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept
 *
 * @param  {string}  accept       The accept header
 * @param  {array}   produces     Our available response types (in order as defined in the openapi file)
 *
 * @return {string | undefined}   If the accept header contains something we would like to
 *                                send, it will be returned, else undefined.
 */
export default (accept: string, produces: string[]): string | undefined => {
  produces = produces.filter(Boolean);
  if (!accept || !produces?.length) {
    return;
  }

  // DOS mitigation - could be safely bumped higher
  const maxHeaderLength = 1024;
  if (accept.length > maxHeaderLength) {
    throw new NotAcceptableException(`Accept header too large. Max length is ${maxHeaderLength}`);
  }

  // this could be moved out since it only needs to be evaluated once per route not every request
  const producable: Record<string, string[]> = {};
  for (const mime of produces) {
    (producable[mime] ||= []).push(mime);
    (producable['*/*'] ||= []).push(mime);
    const main = mime.split('/')[0].trim();
    (producable[main] ||= []).push(mime);
  }

  const prioritizedAccept: { full: string; main: string; sub: string; q: number }[] = [];
  for (const option of accept.split(',')) {
    const [mime, ...extras] = option.split(';').map((x) => x.trim());

    const [main, sub] = mime.split('/');
    const acceptOption = { full: mime, main, sub, q: 1 };

    for (const extra of extras) {
      const [key, value] = extra.split('=').map((x) => x.trim());
      // basic impl: just ignore every other option besides priority (eg charset, lang)
      if (key === 'q') {
        const val = parseFloat(value);
        if (!isNaN(val)) {
          acceptOption.q = val;
        } else {
          // could throw 406 but we just de-prio it if it's malformed
          acceptOption.q = 0;
        }
        break;
      }
    }
    prioritizedAccept.push(acceptOption);
  }

  // for same prio, length of main + sub is a good enough proxy for specificity taking preference
  // https://httpwg.org/specs/rfc9110.html#field.accept "Media ranges can be overridden by more specific media ranges..."
  prioritizedAccept.sort((a, b) => b.q - a.q || (b.main + b.sub).length - (a.main + a.sub).length);

  for (const acceptable of prioritizedAccept) {
    if (acceptable.full in producable) {
      return producable[acceptable.full][0];
    }
    if (acceptable.sub === '*' && acceptable.main in producable) {
      return producable[acceptable.main][0];
    }
  }
};
