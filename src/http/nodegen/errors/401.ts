/* DEPRECATED -  use the exception classes instead */
import { UnauthorizedException } from './';

export default (message?: string ) => new UnauthorizedException(message);