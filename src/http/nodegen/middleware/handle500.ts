import { handleHttpException } from './';

export default () => {
console.warn(
`Deprecation warning: handle500() and the 500.ts error will be removed from the codebase in the future.
Please use handleHttpException.ts to catch all unhandled errors
`)
  return handleHttpException();
}
