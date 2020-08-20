/* DEPRECATED -  use the exception classes instead */
import { ForbiddenException } from './';

export default (message?: string ) => new ForbiddenException(message);