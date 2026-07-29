const themeToggle = document.querySelector('#theme-toggle');
const root = document.documentElement;
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const header = document.querySelector('header');
const navbar = document.querySelector('.navbar');
const scrollTopBtn = document.querySelector('#scroll-top');
const burgerBtn = document.querySelector('.burger');

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

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    navbar.classList.remove('active');
  });
});

burgerBtn.addEventListener('click', () => {
  navbar.classList.toggle('active');
});

document.addEventListener('click', (e) => {
  if (
    navbar.classList.contains('active') &&
    !navbar.contains(e.target) &&
    !burgerBtn.contains(e.target)
  ) {
    navbar.classList.remove('active');
  }
});

const handleScroll = () => {
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 60);
  scrollTopBtn.classList.toggle('visible', y > 300);
};

window.addEventListener('scroll', handleScroll);

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 },
);

document.querySelectorAll('.reveal').forEach((el) => {
  revealObserver.observe(el);
});

const projectsContent = document.querySelector('#projects-content');
const projectsState = {
  status: 'loading',
  repos: [],
  activeLang: 'All',
};

const getRepositorys = async () => {
  const res = await fetch(
    'https://api.github.com/users/opdata/repos?sort=updated&per_page=30',
  );

  if (!res.ok) {
    throw new Error(`GitHub API 요청 실패 (${res.status})`);
  }

  return res.json();
};

const createCard = (repo) => {
  const {
    name,
    description,
    language,
    stargazers_count: stars,
    forks_count: forks,
    html_url: url,
  } = repo;

  const article = document.createElement('article');
  article.className = 'repo-card';
  article.innerHTML = `
    <a target="_blank" rel="noopener">
      <span class="repo-name"></span>
      <span class="repo-desc"></span>
      <span class="repo-meta">
        <span class="repo-lang"></span>
        <span class="repo-stars"></span>
        <span class="repo-forks"></span>
      </span>
    </a>`;

  article.querySelector('a').href = url;
  article.querySelector('.repo-name').textContent = name;
  article.querySelector('.repo-desc').textContent =
    description || '설명이 없습니다.';
  article.querySelector('.repo-lang').textContent = language || 'Text';
  article.querySelector('.repo-stars').textContent = `★ ${stars}`;
  article.querySelector('.repo-forks').textContent = `⑂ ${forks}`;

  return article;
};

const renderProjects = () => {
  const { status, repos, activeLang } = projectsState;

  if (status === 'loading') {
    projectsContent.innerHTML = `
      <div class="projects-loading">
        <span class="spinner"></span>
        <span>저장소를 불러오는 중...</span>
      </div>`;
    return;
  }

  if (status === 'error') {
    projectsContent.innerHTML = `
      <div class="projects-error">
        <strong>프로젝트를 불러올 수 없습니다.</strong>
        <p>네트워크 오류이거나 GitHub API 요청 한도(시간당 60회)를 초과했을 수 있습니다.</p>
        <button type="button" class="retry-btn">다시 시도</button>
      </div>`;
    projectsContent
      .querySelector('.retry-btn')
      .addEventListener('click', loadProjects);
    return;
  }

  if (status === 'empty') {
    const emptyBox = document.createElement('p');
    emptyBox.className = 'projects-empty';
    emptyBox.textContent = '표시할 프로젝트가 없습니다.';
    projectsContent.replaceChildren(emptyBox);
    return;
  }

  const langs = [
    'All',
    ...new Set(repos.map((repo) => repo.language).filter(Boolean)),
  ];
  const shown =
    activeLang === 'All'
      ? repos
      : repos.filter((repo) => repo.language === activeLang);

  projectsContent.innerHTML = `
    <div class="lang-filter"></div>
    <div class="repo-grid"></div>`;

  const filterEl = projectsContent.querySelector('.lang-filter');
  langs.forEach((lang) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `lang-btn${lang === activeLang ? ' active' : ''}`;
    btn.textContent = lang;
    btn.addEventListener('click', () => {
      projectsState.activeLang = lang;
      renderProjects();
    });
    filterEl.appendChild(btn);
  });

  const gridEl = projectsContent.querySelector('.repo-grid');
  gridEl.append(...shown.map((repo) => createCard(repo)));
};

const loadProjects = async () => {
  projectsState.status = 'loading';
  renderProjects();

  try {
    const data = await getRepositorys();
    projectsState.repos = data.filter((repo) => !repo.fork);
    projectsState.status = projectsState.repos.length ? 'success' : 'empty';
  } catch {
    projectsState.status = 'error';
  }

  renderProjects();
};

loadProjects();

const contactForm = document.querySelector('#contact-form');
const formSuccess = contactForm.querySelector('.form-success');
const formError = contactForm.querySelector('.form-error');
const submitBtn = contactForm.querySelector('button[type="submit"]');
const formFields = ['name', 'email', 'message'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getFormErrors = ({ name, email, message }) => {
  const errors = {};

  if (!name.trim()) {
    errors.name = '이름을 입력해 주세요.';
  }

  if (!email.trim()) {
    errors.email = '이메일을 입력해 주세요.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.';
  }

  if (!message.trim()) {
    errors.message = '메시지를 입력해 주세요.';
  }

  return errors;
};

const renderFieldError = (fieldName, errorMessage) => {
  const input = contactForm.elements[fieldName];
  const errorEl = contactForm.querySelector(`[data-error-for="${fieldName}"]`);

  input.classList.toggle('invalid', Boolean(errorMessage));
  errorEl.textContent = errorMessage || '';
};

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const values = {
    name: contactForm.elements.name.value,
    email: contactForm.elements.email.value,
    message: contactForm.elements.message.value,
  };
  const errors = getFormErrors(values);

  formFields.forEach((fieldName) => {
    renderFieldError(fieldName, errors[fieldName]);
  });

  if (Object.keys(errors).length > 0) {
    formSuccess.hidden = true;
    formError.hidden = true;
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = '전송 중...';
  formSuccess.hidden = true;
  formError.hidden = true;

  try {
    const res = await fetch('https://formspree.io/f/mdaqkbvo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      contactForm.reset();
      formSuccess.hidden = false;
    } else {
      const data = await res.json().catch(() => ({}));
      const message =
        data?.errors?.[0]?.message ||
        '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
      formError.textContent = `✕ ${message}`;
      formError.hidden = false;
    }
  } catch {
    formError.textContent =
      '✕ 네트워크 오류로 전송하지 못했습니다. 연결을 확인해 주세요.';
    formError.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '메시지 보내기';
  }
});

formFields.forEach((fieldName) => {
  contactForm.elements[fieldName].addEventListener('input', () => {
    renderFieldError(fieldName, '');
    formSuccess.hidden = true;
    formError.hidden = true;
  });
});
