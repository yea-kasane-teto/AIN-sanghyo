(() => {
  const byId = (id) => document.getElementById(id);

  const vectorInputs = ['vectorA1', 'vectorA2', 'vectorB1', 'vectorB2'].map(byId);
  const lineA = byId('lineA');
  const lineB = byId('lineB');
  const labelA = byId('labelA');
  const labelB = byId('labelB');
  const dotResult = byId('dotResult');
  const directionResult = byId('directionResult');

  function numberValue(input) {
    const value = Number(input.value);
    return Number.isFinite(value) ? Math.max(-9, Math.min(9, value)) : 0;
  }

  function updateVectors() {
    if (vectorInputs.some((input) => !input) || !lineA || !lineB) return;
    const [a1, a2, b1, b2] = vectorInputs.map(numberValue);
    const dot = a1 * b1 + a2 * b2;
    const originX = 140;
    const originY = 78;
    const scale = 7;
    const setLine = (line, x, y) => {
      line.setAttribute('x2', String(originX + x * scale));
      line.setAttribute('y2', String(originY - y * scale));
    };
    setLine(lineA, a1, a2);
    setLine(lineB, b1, b2);
    labelA.setAttribute('x', String(Math.max(10, Math.min(260, originX + a1 * scale + 6))));
    labelA.setAttribute('y', String(Math.max(13, Math.min(147, originY - a2 * scale - 5))));
    labelB.setAttribute('x', String(Math.max(10, Math.min(260, originX + b1 * scale + 6))));
    labelB.setAttribute('y', String(Math.max(13, Math.min(147, originY - b2 * scale - 5))));
    dotResult.textContent = String(dot);
    directionResult.textContent = Math.abs(dot) < 0.0001 ? '직각이에요' : dot > 0 ? '비슷해요' : '반대예요';
  }

  vectorInputs.forEach((input) => input?.addEventListener('input', updateVectors));
  updateVectors();

  const slider = byId('startWeight');
  const weightValue = byId('weightValue');
  const point = byId('descentPoint');
  const trail = byId('descentTrail');
  const message = byId('descentMessage');
  const stepButton = byId('stepButton');
  const chart = { left: 43, right: 331, top: 28, bottom: 119, minW: -1, maxW: 5, maxLoss: 10 };

  if (slider && weightValue && point && trail && message && stepButton) {
    let position = Number(slider.value);
    let steps = 0;

    function toPoint(weight) {
      const x = chart.left + ((weight - chart.minW) / (chart.maxW - chart.minW)) * (chart.right - chart.left);
      const loss = (weight - 2) ** 2 + 1;
      const y = chart.bottom - ((loss - 1) / chart.maxLoss) * (chart.bottom - chart.top);
      return { x, y };
    }

    function drawDescent() {
      const { x, y } = toPoint(position);
      point.setAttribute('cx', x.toFixed(1));
      point.setAttribute('cy', y.toFixed(1));
      weightValue.textContent = 'w = ' + position.toFixed(1);
      stepButton.disabled = Math.abs(position - 2) < 0.03;
      if (steps === 0) message.textContent = '시작점에서 최솟값까지 이동 경로를 확인해보세요.';
    }

    slider.addEventListener('input', () => {
      position = Number(slider.value);
      steps = 0;
      trail.replaceChildren();
      drawDescent();
    });

    stepButton.addEventListener('click', () => {
      const current = toPoint(position);
      const gradient = 2 * (position - 2);
      position -= 0.18 * gradient;
      if (Math.abs(position - 2) < 0.03) position = 2;
      const next = toPoint(position);
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      marker.setAttribute('class', 'trail-point');
      marker.setAttribute('cx', current.x.toFixed(1));
      marker.setAttribute('cy', current.y.toFixed(1));
      marker.setAttribute('r', '3.5');
      trail.append(marker);
      point.setAttribute('cx', next.x.toFixed(1));
      point.setAttribute('cy', next.y.toFixed(1));
      slider.value = position.toFixed(1);
      weightValue.textContent = 'w = ' + position.toFixed(2);
      steps += 1;
      message.textContent = Math.abs(position - 2) < 0.03
        ? steps + '번 이동했어요. 최솟값 w = 2에 도착했어요!'
        : steps + '번 이동 · 기울기 ' + gradient.toFixed(2) + '의 반대 방향으로 움직였어요.';
      stepButton.disabled = Math.abs(position - 2) < 0.03;
    });
    drawDescent();
  }

  const searchInput = byId('Search-bar');
  const emptyState = byId('searchEmpty');
  const sections = [...document.querySelectorAll('[data-searchable]')];
  const navLinks = [...document.querySelectorAll('[data-nav-section]')];

  function filterLessons() {
    if (!searchInput || !emptyState) return;
    const query = searchInput.value.trim().toLocaleLowerCase('ko');
    let visibleCount = 0;
    sections.forEach((section) => {
      const matches = !query || section.textContent.toLocaleLowerCase('ko').includes(query);
      section.hidden = !matches;
      visibleCount += Number(matches);
    });
    navLinks.forEach((link) => {
      const section = document.getElementById(link.dataset.navSection);
      link.hidden = Boolean(query && section?.hidden);
    });
    emptyState.hidden = !query || visibleCount > 0;
  }

  searchInput?.addEventListener('input', filterLessons);
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const typing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    if ((event.key === '/' || (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey))) && !typing) {
      event.preventDefault();
      searchInput?.focus();
    }
    if (event.key === 'Escape' && searchInput && document.activeElement === searchInput) {
      searchInput.value = '';
      filterLessons();
      searchInput.blur();
    }
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.navSection === entry.target.id));
      });
    }, { rootMargin: '-18% 0px -70% 0px' });
    sections.forEach((section) => observer.observe(section));
  }

  const progressKey = 'ain-progress:math-01';
  const progressTrack = byId('progressTrack');
  const progressFill = byId('progressFill');
  const progressLabel = byId('progressLabel');
  const progressPercent = byId('progressPercent');
  const completeButton = byId('completeLesson');

  function updateProgress(isComplete = null) {
    let complete = false;
    try {
      complete = isComplete === null ? localStorage.getItem(progressKey) === 'done' : isComplete;
      if (isComplete !== null) localStorage.setItem(progressKey, complete ? 'done' : '');
    } catch {
      complete = Boolean(isComplete);
    }
    const value = complete ? 100 : 0;
    if (progressTrack) progressTrack.setAttribute('aria-valuenow', String(value));
    if (progressFill) progressFill.style.width = value + '%';
    if (progressLabel) progressLabel.textContent = complete ? '학습 완료' : '학습 진행도';
    if (progressPercent) progressPercent.textContent = value + '%';
    if (completeButton) {
      completeButton.textContent = complete ? '완료 표시 해제' : '이 차시 학습 완료';
      completeButton.setAttribute('aria-pressed', String(complete));
    }
  }

  completeButton?.addEventListener('click', () => {
    const completed = completeButton.getAttribute('aria-pressed') === 'true';
    updateProgress(!completed);
  });
  updateProgress();

  const quizButton = byId('checkQuiz');
  const quizResult = byId('quizResult');
  quizButton?.addEventListener('click', () => {
    const questions = [...document.querySelectorAll('.quiz-question')];
    let correctCount = 0;
    questions.forEach((question) => {
      const selected = question.querySelector('input:checked');
      const correct = selected?.value === question.dataset.answer;
      const feedback = question.querySelector('.quiz-feedback');
      question.classList.toggle('is-correct', Boolean(correct));
      question.classList.toggle('is-incorrect', !correct);
      feedback.textContent = correct
        ? '맞았어요. 계산의 원리를 잘 이해했네요.'
        : selected ? '다시 생각해봐요. 개념 설명을 확인해도 좋아요.' : '답을 하나 선택해 주세요.';
      correctCount += Number(Boolean(correct));
    });
    if (quizResult) quizResult.textContent = correctCount + ' / ' + questions.length + ' 문제 정답';
  });
})();