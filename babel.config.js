module.exports = (api) => {
  api.cache(true);

  const presets = ['next'];
  const plugins = [];

  return {
    presets,
    plugins,
  };
};
