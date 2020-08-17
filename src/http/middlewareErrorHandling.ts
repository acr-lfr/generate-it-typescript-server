import express from 'express';
import {
  handle500,
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
  app.use(handleHttpException);

  // Validation requests
  app.use(handleValidationErrors());

  // Handle 500 errors
  app.use(handle500());
};
