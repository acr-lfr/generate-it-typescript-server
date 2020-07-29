const customError = require('custom-error');
const http403 = customError('http403');
/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Client_error_responses
 * The client does not have access rights to the content; that is, it is unauthorized,
 * so the server is refusing to give the requested resource.
 * Unlike 401, the CLIENT'S IDENTITY IS KNOWN to the server.
 *
 * Example use:
// Import it
import http403 from '@/http/nodegen/errors/403'

// somewhere in your app, eg a domain throw it
throw http403('Forbidden access attempt');

 * Throwing this custom error will then be caught in the handle 403 middleware
 * src/http/nodegen/middleware/handle403.ts
 *
 * The request will simply get in return a http 403 status code
 */
export default http403;
