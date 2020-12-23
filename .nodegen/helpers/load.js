module.exports = (() => {
  const njkEnv = module.parent.exports.default.env;

  njkEnv.addFilter('loads', (data) => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {}
    }
    return data;
  });
  njkEnv.addFilter('anon', (data, cbs) => {
    try {
      return new Function(`return ${cbs}`)()(data);
    } catch (e) {
      return null;
    }
  });

  return () => null;
})();

/*
module.exports = (() => {
  const njkEnv = module.parent.exports.default.env;
  njkEnv.addFilter('get', (data, what) => {
    try {
      if (typeof data === 'string') {
          return JSON.parse(data)[what];
      }
      return data[what];
    } catch (e) {}
  });
  return () => null;
})();

 */
