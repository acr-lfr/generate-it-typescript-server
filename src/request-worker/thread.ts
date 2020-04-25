import { parentPort } from 'worker_threads';
import mongoLoader from 'openapi-nodegen-mongoose-loader';
import config from '@/config';
import 'openapi-nodegen-logger';
import * as Domains from '@/domains/domainsImporter';
import { WorkerData } from './worker-data';

(async () => {
  await mongoLoader(config);

  console.warn(`[request worker] thread ready`);
  parentPort.on('message', async (data: WorkerData) => {
    const { domainName, domainFunction, domainFunctionArgs } = data;

    try {
      const response = await Domains[domainName][domainFunction](...domainFunctionArgs);
      parentPort.postMessage({ response });
    } catch (error) {
      parentPort.postMessage({ error });
    }
  });
})();
