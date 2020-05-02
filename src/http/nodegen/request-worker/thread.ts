import { parentPort } from 'worker_threads';
import 'openapi-nodegen-logger';
import * as Domains from './domainsImporter';
import { WorkerData } from './worker-data';
// Check the config default config to ensure you have the
// worker attibutes: https://github.com/acrontum/openapi-nodegen-typescript-server/blob/master/src/config.ts
// Ensure you also have in the package.json:
// "node-worker-threads-pool": "^1.2.2",
// "worker-farm": "^1.7.0",
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
