import config from '@/config';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Will run a script relative to this file.
 * It is expected the script called will exit by itself.
 */
export default (script: string, cliArgs: Record<string, any>): void => {
  if (config.env === 'production') {
    throw new Error('Do not run scripts on production.');
  }
  const fullPath = path.join(process.cwd(), 'build/src/cli', script + '.js');
  if (!existsSync(fullPath)) {
    throw new Error(`The script requested "${fullPath}" could not be found. Ensure you pass a string to the command eg "npm run cli-script -- user-seeder"`);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require(`./${script}`)(cliArgs);
}
