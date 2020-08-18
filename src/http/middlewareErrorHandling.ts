import express from 'express';
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

  // Validation requests
  app.use(handleValidationErrors());

  // Handle HTTP errors
  app.use(handleHttpException());
};
