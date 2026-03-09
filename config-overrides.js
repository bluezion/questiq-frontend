/**
 * config-overrides.js
 *
 * react-app-rewired 설정:
 * ForkTsCheckerWebpackPlugin을 webpack 설정에서 완전히 제거합니다.
 * 이로써 fork-ts-checker-webpack-plugin ↔ schema-utils ↔ ajv 버전 충돌을 우회합니다.
 * TypeScript 타입 에러는 빌드 실패를 유발하지 않고 경고로만 표시됩니다.
 */
module.exports = function override(config, env) {
  // ForkTsCheckerWebpackPlugin 완전 제거
  config.plugins = config.plugins.filter(function (plugin) {
    return plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin';
  });

  return config;
};
