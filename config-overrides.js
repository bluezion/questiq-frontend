/**
 * config-overrides.js
 * react-app-rewired 설정: ForkTsCheckerWebpackPlugin 제거
 * 이유: react-scripts 5.0.1 + Node 18 환경에서
 *       fork-ts-checker의 schema-utils v3가 상위 ajv-keywords v5를
 *       참조하며 "Unknown keyword formatMinimum" 에러 발생
 *       → TypeScript 타입 체크를 빌드 시 스킵하여 회피
 */
module.exports = function override(config) {
  // ForkTsCheckerWebpackPlugin 인스턴스 제거
  config.plugins = config.plugins.filter(
    (plugin) => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
  );
  return config;
};
