/* DEPRECATED -  use the exception classes instead */
import { LockedException } from './';

export default (message?: string) => new LockedException(message);

