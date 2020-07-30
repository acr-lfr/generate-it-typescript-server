const customError = require('custom-error');
const http410 = customError('http410');

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Client_error_responses
 * This response is sent when the requested content has been permanently deleted from server,
 * with no forwarding address. Clients are expected to remove their caches and links to the
 * resource. The HTTP specification intends this status code to be used for "limited-time,
 * promotional services". APIs should not feel compelled to indicate resources that have
 * been deleted with this status code.
 *
 * Example use:
 // Import it
 import http410 from '@/http/nodegen/errors/410'

 // somewhere in your app, eg a domain throw it
 throw http410('Forbidden access attempt');

 * Throwing this custom error will then be caught in the handle 410 middleware
 * src/http/nodegen/middleware/handle410.ts
 *
 * The request will simply get in return a http 410 status code
 */
export default http410;
