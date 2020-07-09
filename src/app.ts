import express from 'express'
import middlewareErrorHandling from './http/middlewareErrorHandling'
import middlewaresImporter from './http/middlewaresImporter'
import routesImporter from './http/nodegen/routesImporter'

/**
 * Returns a promise allowing the server or cli script to know
 * when the app is ready; eg database connections established
 */
export default (): Promise<express.Express> => {
  return new Promise((resolve, reject) => {
    // Here is a good place to connect to databases if required,
    // resolve once connected else reject
    const app = express()
    middlewaresImporter(app)
    routesImporter(app)
    middlewareErrorHandling(app)
    return resolve(app)
  })
}
