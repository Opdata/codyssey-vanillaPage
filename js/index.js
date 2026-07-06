const initNavScroll = () => {
  const nav = document.querySelectorAll('.navbar a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });
};

const getRepository = async () => {
  const res = await fetch('https://api.github.com/users/opdata/repos');

  if (!res.ok) {
    throw new Error('프로젝트를 불러올 수 없습니다.');
  }

  const result = await res.json();

  return result;
};

getRepository();
initNavScroll();
