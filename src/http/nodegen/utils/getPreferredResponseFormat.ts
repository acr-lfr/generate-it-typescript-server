/**
 * Figure out which response type to send based on accept header
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept
 *
 * @param  {string}  accept       The accept header
 * @param  {array}   mimes        Our desired response types (in order as defined in the openapi file)
 *
 * @return {string | undefined}   If the accept header contains something we would like to
 *                                send, it will be returned, else undefined.
 */
export default (accept: string, mimes: string[]): string | undefined => {
  if (!accept || !mimes?.length) {
    return;
  }

  // escape all special chars except *
  const formatRegex = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

  const priority: string[][] = accept.split(/\s*,\s*/).reduce((acc: string[][], val) => {
    const [mime, ...extra] = val.split(/\s*;\s*/);

    // extension might look like { q: '0.1', charset: 'utf-8' }
    // https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.1
    const extension = extra.reduce((acc: Record<string, string>, val) => {
      const [key, value] = val.split('=').map(s => s.trim());
      acc[key] = value;

      return acc;
    }, {});

    const prioValue = (extension.p || '1').replace(/.*=\s*/, '');
    const index = 10 - Math.round(parseFloat(prioValue) * 10);
    acc[index] = (acc[index] || []).concat(mime);

    return acc;
  }, []);

  const parts = [...mimes, '*/*'].reduce((acc: string[], mime) => {
    if (!mime) {
      return acc;
    }
    const [type, subtype] = mime.split('/').map(formatRegex);
    if (!subtype) {
      return acc.concat(type.replace(/\*/g, '\\*'));
    }

    return acc.concat(`${type}\/(${subtype}|*)`.replace(/\*/g, '\\*'));
  }, []);

  const willAccept = new RegExp(parts.join('|'));
  const matchingAccept = priority.find((mimeTypes) => mimeTypes.find((mime) => willAccept.test(mime)))?.[0];

  if (!matchingAccept) {
    return;
  }


  const matchRegex = new RegExp(matchingAccept.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*'));

  return mimes.find((mime) => matchRegex.test(mime));
};
