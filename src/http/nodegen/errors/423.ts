/* DEPRECATED -  use the exception classes instead */
import { HttpException } from './';

export default (message?: string) => new HttpException(423, message);

