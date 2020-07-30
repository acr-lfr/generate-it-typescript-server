const customError = require('custom-error');
const http429 = customError('http429');

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Client_error_responses
 * The user has sent too many requests in a given amount of time ("rate limiting").
 *
 * Example use:
 // Import it
 import http429 from '@/http/nodegen/errors/429'

 // somewhere in your app, eg a domain throw it
 throw http429('Forbidden access attempt');

 * Throwing this custom error will then be caught in the handle 429 middleware
 * src/http/nodegen/middleware/handle429.ts
 *
 * The request will simply get in return a http 429 status code
 */
export default http429;
