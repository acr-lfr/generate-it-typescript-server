import { parentPort } from 'worker_threads';
import 'openapi-nodegen-logger';
import * as Domains from '@/domains/domainsImporter';
import { WorkerData } from './worker-data';

(async () => {
  console.warn(`[request worker] thread ready`);
  parentPort.on('message', async (data: WorkerData) => {
    const { domainName, domainFunction, domainFunctionArgs } = data;

    try {
      // @ts-ignore
      const response: any = await Domains[domainName][domainFunction](...domainFunctionArgs);
      parentPort.postMessage({ response });
    } catch (error) {
      parentPort.postMessage({ error });
    }
  });
})();
