import { StaticPool } from 'node-worker-threads-pool';
import config from '@/config';
import { WorkerData } from './worker-data';

// Check the config default config to ensure you have the
// worker attibutes: https://github.com/acrontum/openapi-nodegen-typescript-server/blob/master/src/config.ts
// Ensure you also have in the package.json:
// "node-worker-threads-pool": "^1.2.2",
// "worker-farm": "^1.7.0",
const pool = new StaticPool({
  size: config.requestWorker.threadsPerProcess,
  task: `${process.cwd()}/build/src/http/nodegen/request-worker/thread.js`,
});

console.log('[request worker] process ready');

module.exports = async ({ domainName, domainFunction, domainFunctionArgs }: WorkerData, callback: any) => {
  const { error, response } = await pool.exec({
    domainName,
    domainFunction,
    domainFunctionArgs,
  }, config.requestWorker.timeoutMs);

  if (error) {
    return callback(error);
  }

  callback(undefined, response);
};
