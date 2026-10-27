(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const searchInput = byId('Search-bar');
  const emptyState = byId('searchEmpty');
  const sections = [...document.querySelectorAll('section[data-searchable]')];
  const navLinks = [...document.querySelectorAll('a[data-nav-section]')];

  function setActiveSection(sectionId) {
    navLinks.forEach((link) => {
      const active = !link.hidden && link.dataset.navSection === sectionId;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function updateActiveSection() {
    const visibleSections = sections.filter((section) => !section.hidden);
    const readingLine = window.innerHeight * 0.18;
    let current = visibleSections[0];
    visibleSections.forEach((section) => {
      if (section.getBoundingClientRect().top <= readingLine) current = section;
    });
    setActiveSection(current?.id);
  }

  function filterLessons() {
    const query = searchInput?.value.trim().toLocaleLowerCase('ko') || '';
    let visibleCount = 0;
    sections.forEach((section) => {
      const matches = !query || section.textContent.toLocaleLowerCase('ko').includes(query);
      section.hidden = !matches;
      visibleCount += Number(matches);
    });
    navLinks.forEach((link) => {
      const section = byId(link.dataset.navSection);
      link.hidden = Boolean(query && section?.hidden);
    });
    if (emptyState) emptyState.hidden = !query || visibleCount > 0;
    updateActiveSection();
  }

  searchInput?.addEventListener('input', filterLessons);
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const typing = target instanceof HTMLElement &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    const searchShortcut = event.key === '/' ||
      (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey));
    if (searchInput && searchShortcut && !typing) {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === 'Escape' && searchInput && document.activeElement === searchInput) {
      searchInput.value = '';
      filterLessons();
      searchInput.blur();
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => setActiveSection(link.dataset.navSection));
  });

  document.querySelectorAll('.lesson-content a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      const target = byId(link.getAttribute('href').slice(1));
      if (target?.hidden && searchInput) {
        searchInput.value = '';
        filterLessons();
      }
    });
  });

  let activeFrame = null;
  function scheduleActiveSection() {
    if (activeFrame !== null) return;
    activeFrame = window.requestAnimationFrame(() => {
      activeFrame = null;
      updateActiveSection();
    });
  }
  window.addEventListener('scroll', scheduleActiveSection, { passive: true });
  window.addEventListener('resize', scheduleActiveSection);
  filterLessons();

  const progressKey = 'ain-progress:ml-01';
  const progressTrack = byId('progressTrack');
  const progressFill = byId('progressFill');
  const progressLabel = byId('progressLabel');
  const progressPercent = byId('progressPercent');
  const completeButton = byId('completeLesson');
  let completed = false;
  try {
    completed = localStorage.getItem(progressKey) === 'done';
  } catch {
    // Completion can still be toggled for this page when storage is unavailable.
  }

  function renderProgress() {
    const value = completed ? 100 : 0;
    if (progressTrack) {
      progressTrack.setAttribute('aria-valuenow', String(value));
      progressTrack.setAttribute('aria-valuetext', value + '%');
    }
    if (progressFill) progressFill.style.width = value + '%';
    if (progressLabel) progressLabel.textContent = completed ? '학습 완료' : '학습 진행도';
    if (progressPercent) progressPercent.textContent = value + '%';
    if (completeButton) {
      completeButton.textContent = completed ? '완료 표시 해제' : '이 차시 학습 완료';
      completeButton.setAttribute('aria-pressed', String(completed));
    }
  }

  completeButton?.addEventListener('click', () => {
    completed = !completed;
    try {
      localStorage.setItem(progressKey, completed ? 'done' : '');
    } catch {
      // Keep the visible completion state even if it cannot be saved.
    }
    renderProgress();
  });
  renderProgress();
})();
