// http/nodegen/middleware/applicationMiddleware.ts
import {
  corsMiddleware,
  handleDomain404,
  handleExpress404,
  handleHttpException,
  headersCaching,
  inferResponseType,
} from '@/http/nodegen/middleware';
import express from 'express';
import expressFormData from 'express-form-data';
import morgan from 'morgan';
import { tmpdir } from 'os';
import packageJson from '../../../../package.json';

type AccessLoggerOptions = morgan.Options<express.Request, express.Response>;

export type AppMiddlewareOptions = {
  accessLogger?: AccessLoggerOptions;
};

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
  app.use(express.json({ limit: '50mb' }));

  // clear all empty files (size == 0)
  app.use(expressFormData.format());

  // union body and files
  app.use(expressFormData.union());

  // parse the body
  app.use(express.urlencoded({ extended: false }));
};

const ipHeaders = [
  'x-client-ip',
  'x-forwarded-for',
  'cf-connecting-ip',
  'do-connecting-ip',
  'fastly-client-ip',
  'true-client-ip',
  'x-real-ip',
  'x-cluster-client-ip',
  'x-forwarded',
  'forwarded-for',
  'forwarded',
  'x-appengine-user-ip',
  'cf-pseudo-ipv4',
];

const getIpHeader = (req: express.Request): string => {
  for (const header of ipHeaders) {
    if (req[header]?.length) {
      return req[header];
    }
  }

  return req.socket.remoteAddress;
}

export const accessLogger = (app: express.Application, accessLoggerOpts?: AccessLoggerOptions): void => {
  // A bug in the morgan logger results in IPs being dropped when the node instance is running behind a proxy.
  // The following pattern uses the requestIp middleware "req.client" and adds the response time.
  // `[${packageJson.name}] :remote-addr [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]`
  app.use(morgan(function (tokens, req, res) {
    return [
      '[' + packageJson.name + ']',
      getIpHeader(req),
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
  }, accessLoggerOpts));
};

/**
 * Injects routes into the passed express app
 * @param app
 */
export const requestMiddleware = (app: express.Application, appMiddlewareOpts?: AppMiddlewareOptions): void => {
  accessLogger(app, appMiddlewareOpts?.accessLogger);
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
  app.use(handleHttpException());
};
