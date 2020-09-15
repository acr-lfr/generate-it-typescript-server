import express from 'express';
import handle401 from '@/http/nodegen/middleware/handle401';
import handle403 from '@/http/nodegen/middleware/handle403';
import handle409 from '@/http/nodegen/middleware/handle409';
import handle406 from '@/http/nodegen/middleware/handle406';
import handle410 from '@/http/nodegen/middleware/handle410';
import handle422 from '@/http/nodegen/middleware/handle422';
import handle423 from '@/http/nodegen/middleware/handle423';
import handle429 from '@/http/nodegen/middleware/handle429';
import {
  handleDomain404,
  handleExpress404,
  handleHttpException,
  handleValidationErrors,
} from './nodegen/middleware/';
/**
 * Injects routes into the passed express app
 * @param app
 */
export default (app: express.Application): void => {
  app.use(handleExpress404());
  app.use(handleDomain404());

  // A deprecation warning is now thrown in each of these middlewares
  app.use(handle401());
  app.use(handle403());
  app.use(handle406());
  app.use(handle409());
  app.use(handle410());
  app.use(handle422());
  app.use(handle423());
  app.use(handle429());

  // Validation requests
  app.use(handleValidationErrors());

  // Handle HTTP errors
  app.use(handleHttpException());
};
