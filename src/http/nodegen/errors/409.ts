/* DEPRECATED -  use the exception classes instead */
import { ConflictException } from './';

export default (message?: string ) => new ConflictException(message);