const themeToggle = document.querySelector('#theme-toggle');
const root = document.documentElement;
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

const applyTheme = (theme) => {
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
};

const saved = localStorage.getItem('theme');
if (saved) {
  applyTheme(saved);
} else {
  applyTheme(systemDark.matches ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

systemDark.addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});

const nav = document.querySelectorAll('.navbar a').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    target.scrollIntoView({ behavior: 'smooth' });
  });
});

const getRepositorys = async () => {
  const res = await fetch('https://api.github.com/users/opdata/repos');

  if (!res.ok) {
    throw new Error('프로젝트를 불러올 수 없습니다.');
  }

  const result = await res.json();

  return result;
};

getRepositorys();
