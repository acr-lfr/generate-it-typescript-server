const customError = require('custom-error');
const http404 = customError('http404');

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Client_error_responses
 * The server can not find the requested resource. In the browser, this means the URL is not recognized.
 * In an API, this can also mean that the endpoint is valid but the resource itself does not exist.
 * Servers may also send this response instead of 403 to hide the existence of a resource from an
 * unauthorized client. This response code is probably the most famous one due to its frequent occurrence
 * on the web.
 *
 *
 * Example use:
 // Import it
 import http404 from '@/http/nodegen/errors/404'

 // somewhere in your app, eg a domain throw it
 throw http404('Forbidden access attempt');

 * Throwing this custom error will then be caught in the handle 404 middleware
 * src/http/nodegen/middleware/handle404.ts
 *
 * The request will simply get in return a http 404 status code
 */
export default http404;
