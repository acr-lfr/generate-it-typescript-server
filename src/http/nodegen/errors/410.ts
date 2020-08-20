/* DEPRECATED -  use the exception classes instead */
import { GoneException } from './';

export default (message?: string) => new GoneException(message);
