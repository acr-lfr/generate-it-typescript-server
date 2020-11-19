import 'generate-it-logger';
import run from '@/cli/run';
import app from './src/app';
import appCli from './src/app.cli';
import config from './src/config';

const cliInput = appCli();
const PORT = cliInput.port || config.port;

app(PORT)
  .then((http) => cliInput['run-script'] ? run(cliInput['run-script'])(cliInput) : http.start())
  .catch((e) => { throw e; });
