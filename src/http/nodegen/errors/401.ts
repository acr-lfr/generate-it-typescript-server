const customError = require('custom-error');
const http401 = customError('http401');
/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Client_error_responses
 * Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated".
 * That is, the CLIENT MUST AUTHENTICATE ITSELF to get the requested response.
 *
 * 401 is NOT the same as a 403
 *
 * Example use:
 // Import it
 import http401 from '@/http/nodegen/errors/401'

 // somewhere in your app, eg a domain throw it
 throw http401('Forbidden access attempt');

 * Throwing this custom error will then be caught in the handle 401 middleware
 * src/http/nodegen/middleware/handle401.ts
 *
 * The request will simply get in return a http 401 status code
 */
export default http401;
