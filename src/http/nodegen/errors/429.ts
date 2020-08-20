/* DEPRECATED -  use the exception classes instead */
import { TooManyRequestsException } from './';

export default (message?: string) => new TooManyRequestsException(message);
