import { StaticPool } from 'node-worker-threads-pool';
import config from '@/config';
import { WorkerData } from './worker-data';

const pool = new StaticPool({
  size: config.requestWorker.threadsPerProcess,
  task: `${process.cwd()}/build/src/request-worker/thread.js`
});

console.log('[request worker] process ready');

module.exports = async ({ domainName, domainFunction, domainFunctionArgs }: WorkerData, callback: any) => {
  const { error, response } = await pool.exec({
    domainName,
    domainFunction,
    domainFunctionArgs
  }, config.requestWorker.timeoutMs);

  if (error) {
    return callback(error);
  }

  callback(null, response);
};
