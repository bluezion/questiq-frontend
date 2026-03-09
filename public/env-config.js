// 런타임 환경변수 주입 파일
// serve-entrypoint.sh 가 이 파일을 동적으로 생성합니다.
// 빌드 타임에 REACT_APP_API_URL 이 주입되지 않았을 경우의 런타임 fallback
window._env_ = window._env_ || {};
