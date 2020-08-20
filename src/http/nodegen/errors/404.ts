/* DEPRECATED -  use the exception classes instead */
import { NotFoundException } from './';

export default (message?: string ) => new NotFoundException(message);