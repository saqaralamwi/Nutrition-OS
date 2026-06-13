module.exports = function (api) {
  api.cache(true);

  const isCacheKey = new Error().stack?.includes('getCacheKey') ?? false;

  const config = {
    presets: ['babel-preset-expo'],
    plugins: []
  };

  if (!isCacheKey) {
    config.overrides = [
      {
        test: /[\\/]src[\\/]/,
        plugins: [
          ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-transform-class-properties', { loose: true }],
          ['@babel/plugin-transform-private-methods', { loose: true }],
          ['@babel/plugin-transform-private-property-in-object', { loose: true }]
        ]
      }
    ];
  }

  return config;
};
