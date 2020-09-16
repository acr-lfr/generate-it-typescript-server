// http/nodegen/middleware/applicationMiddleware.ts
import {
  corsMiddleware,
  handleDomain404,
  handleExpress404,
  handleHttpException,
  handleValidationErrors,
  headersCaching,
} from '@/http/nodegen/middleware';
import queryArrayParserMiddleware from '@/http/nodegen/middleware/queryArrayParserMiddleware';
import bodyParser from 'body-parser';
import express from 'express';
import expressFormData from 'express-form-data';
import morgan from 'morgan';
import { tmpdir } from 'os';
import requestIp from 'request-ip';
import packageJson from '../../../../package.json';

export const responseHeaders = (app: express.Application): void => {
  app.use(corsMiddleware());
  app.use(headersCaching());
};

export const requestParser = (app: express.Application): void => {
  // parse data with connect-multiparty
  app.use(
    expressFormData.parse({
      autoClean: true,
      autoFiles: true,
      uploadDir: tmpdir(),
    })
  );
  app.use(bodyParser.json({ limit: '50mb' }));

  // parse query params
  app.use(queryArrayParserMiddleware());

  // clear all empty files (size == 0)
  app.use(expressFormData.format());

  // union body and files
  app.use(expressFormData.union());

  // parse the body
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use(requestIp.mw());
};

export const accessLogger = (app: express.Application): void => {
  // Log all requests
  app.use(
    morgan(
      `[${packageJson.name}] :remote-addr [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]`
    )
  );
};

/**
 * Injects routes into the passed express app
 * @param app
 */
export const requestMiddleware = (app: express.Application): void => {
  accessLogger(app);
  requestParser(app);
  responseHeaders(app);
};

/**
 * Injects routes into the passed express app
 * @param app
 */
export const responseMiddleware = (app: express.Application): void => {
  app.use(handleExpress404());
  app.use(handleDomain404());

  // Validation requests
  app.use(handleValidationErrors());

  // Handle HTTP errors
  app.use(handleHttpException());
};
