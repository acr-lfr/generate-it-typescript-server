const customError = require('custom-error');
const http422 = customError('http422');

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Client_error_responses
 * The request was well-formed but was unable to be followed due to semantic errors.
 * A response given from Joi during validation
 *
 * Example use of the simple 422:
 // Import it
 import http422 from '@/http/nodegen/errors/422'

 // somewhere in your app, eg a domain throw it
 throw http422();

 * Throwing this custom error will then be caught in the handle 422 middleware
 * src/http/nodegen/middleware/handle422.ts
 *
 * The request will simply get in return a http 422 status code
 */
export default http422;
