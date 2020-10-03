/**
 * Figure out which response type to send based on accept header
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept
 *
 * @param  {string}  acceptHeaderValue  The accept header
 * @param  {array}   mimes   Our desired response types (in order as defined in the openapi file)
 *
 * @return {string | undefined}  If the accept header contains something we would like to
 *                   send, it will be returned, else undefined.
 */
export default (acceptHeaderValue: string, mimes: string[]): string => {
  mimes = Object.assign([], mimes);

  const priority: string[][] = acceptHeaderValue.split(/\s*,\s*/).reduce((acc, val) => {
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

    return `${type}\/(${subtype}|*)`.replace(/\*/g, '\\*');
  });

  const willAccept = new RegExp(parts.join('|'));
  const preference = priority.find(mimeTypes => mimeTypes.find(mime => willAccept.test(mime)));

  return preference ?
    preference[0] === '*/*' ? mimes[1] : preference[0] :
    undefined;
}
