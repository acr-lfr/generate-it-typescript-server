/* DEPRECATED -  use the exception classes instead */
import { NotAcceptableException } from './';

export default (message?: string ) => new NotAcceptableException(message);