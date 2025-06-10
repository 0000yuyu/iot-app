module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel', // ✨ 이 부분이 중요합니다.
    ],
  };
};
