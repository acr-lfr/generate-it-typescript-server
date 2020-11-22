// http/nodegen/middleware/applicationMiddleware.ts
import {
  corsMiddleware,
  handleDomain404,
  handleExpress404,
  handleHttpException,
  handleValidationErrors,
  headersCaching,
  inferResponseType,
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
  // A bug in the morgan logger results in IPs being dropped when the node instance is running behind a proxy.
  // The following pattern uses the requestIp middleware "req.client" and adds the response time.
  // `[${packageJson.name}] :remote-addr [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]`
  app.use(morgan(function (tokens, req, res) {
    return [
      '[' + packageJson.name + ']',
      req.clientIp,
      '[' + new Date().toISOString() + ']',
      '"' + tokens.method(req, res),
      tokens.url(req, res),
      'HTTP/' + tokens['http-version'](req, res) + '"',
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'),
      '-',
      tokens['response-time'](req, res),
      'ms'
    ].join(' ');
  }));
};

/**
 * Injects routes into the passed express app
 * @param app
 */
export const requestMiddleware = (app: express.Application): void => {
  accessLogger(app);
  requestParser(app);
  responseHeaders(app);
  app.use(inferResponseType());
};

/**
 * Injects routes into the passed express app
 * @param app
 */
export const responseMiddleware = (app: express.Application): void => {
  app.use(handleExpress404());
  app.use(handleDomain404());
  app.use(handleValidationErrors());
  app.use(handleHttpException());
};
