/* DEPRECATED -  use the exception classes instead */
import { UnprocessableEntityException } from './';

export default (message?: string) => new UnprocessableEntityException(message);
