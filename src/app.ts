import { requestMiddleware, responseMiddleware } from '@/http/nodegen/middleware';
import routesImporter from '@/http/nodegen/routesImporter';
import express from 'express';

/**
 * Returns a promise allowing the server or cli script to know
 * when the app is ready; eg database connections established
 */
export default (): Promise<express.Express> => {
  return new Promise((resolve, reject) => {
    // Here is a good place to connect to databases if required,
    // resolve once connected else reject
    const app = express();

    requestMiddleware(app);
    routesImporter(app);
    responseMiddleware(app);
    return resolve(app);
  });
};
