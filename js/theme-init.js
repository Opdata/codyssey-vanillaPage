// FOUC 방지: 첫 페인트 이전에 테마를 적용해야 하므로 defer 없이 동기 실행한다.
// index.js와 전역 스코프를 공유하므로 IIFE로 감싼다.
(function () {
  const saved = localStorage.getItem('theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (systemDark ? 'dark' : 'light');

  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
