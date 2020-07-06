import commandLineArgs from 'command-line-args';

const optionDefinitions = [
  { name: 'port', alias: 'p', type: Number },
  { name: 'run-script', alias: 'r', type: String },
];

/**
 * Export the cli options passed via cli when starting the application
 * @returns {Object}
 */
export default (): commandLineArgs.CommandLineOptions => {
  return commandLineArgs(optionDefinitions);
};
