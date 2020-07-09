import 'generate-it-logger';
import run from '@/cli/run';
import app from './src/app';
import appCli from './src/app.cli';
import config from './src/config';
import packageJson from './package.json';

const cliInput = appCli();
const PORT = cliInput.port || config.port;

app()
  .then((expressApp) => {
    if (cliInput['run-script']) {
      // call the script runner
      run(cliInput['run-script']);
    } else {
      // Start listening for incoming HTTP requests
      expressApp.listen(PORT, () => {
        console.log(`${packageJson.name}:${packageJson.version} server listening on port, ${PORT}`);
      });
    }
  }).catch((e) => {
  console.error('Error calling the app:');
  throw e;
});
