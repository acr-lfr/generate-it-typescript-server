const customError = require('custom-error');
const http406 = customError('http406');

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Client_error_responses
 * This response is sent when the web server, after performing server-driven content negotiation,
 * doesn't find any content that conforms to the criteria given by the user agent.
 *
 * THIS IS NOT THE SAME AS A 422
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
export default http406;
