(() => {
  const numberValue = (input) => {
    const value = Number(input.value);
    return Number.isFinite(value) ? Math.max(-9, Math.min(9, value)) : 0;
  };

  const vectorInputs = ['vectorA1', 'vectorA2', 'vectorB1', 'vectorB2'].map((id) => document.getElementById(id));
  const lineA = document.getElementById('lineA');
  const lineB = document.getElementById('lineB');
  const labelA = document.getElementById('labelA');
  const labelB = document.getElementById('labelB');
  const dotResult = document.getElementById('dotResult');
  const directionResult = document.getElementById('directionResult');

  function updateVectors() {
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
    if (Math.abs(dot) < 0.0001) directionResult.textContent = '직각이에요';
    else if (dot > 0) directionResult.textContent = '비슷해요';
    else directionResult.textContent = '반대예요';
  }

  vectorInputs.forEach((input) => input.addEventListener('input', updateVectors));
  updateVectors();

  const slider = document.getElementById('startWeight');
  const weightValue = document.getElementById('weightValue');
  const point = document.getElementById('descentPoint');
  const trail = document.getElementById('descentTrail');
  const message = document.getElementById('descentMessage');
  const stepButton = document.getElementById('stepButton');
  const chart = { left: 43, right: 331, top: 28, bottom: 119, minW: -1, maxW: 5, maxLoss: 10 };
  let position = Number(slider.value);
  let steps = 0;

  function toPoint(weight) {
    const x = chart.left + ((weight - chart.minW) / (chart.maxW - chart.minW)) * (chart.right - chart.left);
    const loss = (weight - 2) ** 2 + 1;
    const y = chart.bottom - ((loss - 1) / chart.maxLoss) * (chart.bottom - chart.top);
    return { x, y, loss };
  }

  function drawDescent() {
    const { x, y } = toPoint(position);
    point.setAttribute('cx', x.toFixed(1));
    point.setAttribute('cy', y.toFixed(1));
    weightValue.textContent = `w = ${position.toFixed(1)}`;
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
    weightValue.textContent = `w = ${position.toFixed(2)}`;
    steps += 1;
    message.textContent = Math.abs(position - 2) < 0.03
      ? `${steps}번 이동했어요. 최솟값 w = 2에 도착했어요!`
      : `${steps}번 이동 · 기울기 ${gradient.toFixed(2)}의 반대 방향으로 움직였어요.`;
    stepButton.disabled = Math.abs(position - 2) < 0.03;
  });

  drawDescent();

  const shell = document.getElementById('appShell');
  const menuButton = document.getElementById('menuButton');
  menuButton.addEventListener('click', () => {
    const isOpen = shell.classList.toggle('sidebar-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? '학습 목차 닫기' : '학습 목차 열기');
  });
  document.querySelectorAll('.lesson-nav a').forEach((link) => link.addEventListener('click', () => {
    shell.classList.remove('sidebar-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '학습 목차 열기');
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      shell.classList.remove('sidebar-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', '학습 목차 열기');
    }
  });
})();
