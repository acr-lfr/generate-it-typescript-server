import app from '@/app';
import appCli from '@/app.cli';
import run from '@/cli/run';
import config from '@/config';
import 'generate-it-logger';
import 'source-map-support/register';

const cliInput = appCli();
const PORT = cliInput.port || config.port;

app(PORT)
  .then(async (http) => {
    if (cliInput['run-script']) {
      return run(cliInput['run-script'], cliInput);
    } else {
      await http.start();
    }
  })
  .catch((e) => {
    throw e;
  });
