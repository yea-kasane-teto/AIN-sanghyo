(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const sections = [...document.querySelectorAll('[data-searchable]')];
  const navLinks = [...document.querySelectorAll('[data-nav-section]')];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const fmt = (value, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : '0.00';
  const svgEl = (tag, attrs = {}) => {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  };

  function valueY(count, top, bottom) {
    if (count === 1) return [((top + bottom) / 2)];
    return Array.from({ length: count }, (_, i) => top + (bottom - top) * i / (count - 1));
  }

  function renderArchitecture() {
    const depth = Number($('depthControl').value);
    const width = Number($('widthControl').value);
    const layers = [3, ...Array(depth).fill(width), 2];
    const svg = $('architectureGraph');
    const points = layers.map((count, index) => ({
      x: 64 + index * (632 / (layers.length - 1)),
      ys: valueY(count, 66, 207),
      count,
      index,
    }));
    const parts = [];
    points.slice(0, -1).forEach((layer, index) => {
      const next = points[index + 1];
      layer.ys.forEach(y1 => next.ys.forEach(y2 => parts.push(`<line class="dl-network-edge" x1="${layer.x}" y1="${y1}" x2="${next.x}" y2="${y2}"/>`)));
    });
    points.forEach((layer, index) => {
      layer.ys.forEach(y => parts.push(`<circle class="dl-neuron ${index === 0 ? 'dl-neuron--input' : index === points.length - 1 ? 'dl-neuron--output' : 'dl-neuron--hidden'}" cx="${layer.x}" cy="${y}" r="14"/>`));
      const label = index === 0 ? '입력층' : index === points.length - 1 ? '출력층' : `은닉층 ${index}`;
      parts.push(`<text class="dl-layer-caption" x="${layer.x}" y="252">${label}</text>`);
      parts.push(`<text class="dl-layer-caption" x="${layer.x}" y="32">${layer.count}개</text>`);
    });
    svg.innerHTML = parts.join('');
    const neurons = depth * width;
    const connections = layers.slice(0, -1).reduce((sum, count, index) => sum + count * layers[index + 1], 0);
    $('depthValue').textContent = `${depth}층`;
    $('widthValue').textContent = `${width}개`;
    $('neuronCount').textContent = `${neurons}개`;
    $('connectionCount').textContent = `${connections}개`;
    $('architectureCaption').textContent = `은닉층 ${depth}개와 층별 뉴런 ${width}개로 구성된 신경망이에요.`;
    svg.setAttribute('aria-label', `입력층 3개, 은닉층 ${depth}개와 층별 뉴런 ${width}개, 출력층 2개로 구성된 신경망`);
  }

  function activate(name, value) {
    if (name === 'sigmoid') {
      if (value >= 0) return 1 / (1 + Math.exp(-value));
      const exp = Math.exp(value);
      return exp / (1 + exp);
    }
    if (name === 'tanh') return Math.tanh(value);
    return Math.max(0, value);
  }

  function activationSettings(name) {
    if (name === 'sigmoid') return { minY: 0, maxY: 1, describe: '큰 양수는 1에, 큰 음수는 0에 가까운 값으로 바꿔요.' };
    if (name === 'tanh') return { minY: -1, maxY: 1, describe: '입력 신호를 -1과 1 사이의 값으로 바꿔요.' };
    return { minY: 0, maxY: 5, describe: '음수 신호는 0으로, 양수 신호는 그대로 전달해요.' };
  }

  function renderActivation() {
    const name = $('activationSelect').value;
    const input = Number($('activationInput').value);
    const settings = activationSettings(name);
    const output = activate(name, input);
    const left = 48, right = 498, top = 20, bottom = 222;
    const mapX = x => left + (x + 5) / 10 * (right - left);
    const mapY = y => bottom - (y - settings.minY) / (settings.maxY - settings.minY) * (bottom - top);
    const path = [];
    for (let i = 0; i <= 100; i += 1) {
      const x = -5 + i / 10;
      path.push(`${i === 0 ? 'M' : 'L'}${mapX(x).toFixed(1)} ${mapY(activate(name, x)).toFixed(1)}`);
    }
    const grid = [];
    for (let i = 0; i <= 4; i += 1) {
      const x = -5 + i * 2.5;
      grid.push(`<line class="dl-chart-grid" x1="${mapX(x)}" y1="${top}" x2="${mapX(x)}" y2="${bottom}"/><text class="dl-chart-tick" x="${mapX(x)}" y="244">${x}</text>`);
    }
    const zeroY = settings.minY <= 0 && settings.maxY >= 0 ? mapY(0) : bottom;
    const markerX = mapX(input), markerY = mapY(output);
    $('activationGraph').innerHTML = `${grid.join('')}<line class="dl-chart-grid" x1="${left}" y1="${mapY(settings.maxY)}" x2="${right}" y2="${mapY(settings.maxY)}"/><line class="dl-chart-axis" x1="${left}" y1="${zeroY}" x2="${right}" y2="${zeroY}"/><line class="dl-chart-axis" x1="${mapX(0)}" y1="${top}" x2="${mapX(0)}" y2="${bottom}"/><path class="dl-chart-path" d="${path.join(' ')}"/><circle class="dl-chart-marker" cx="${markerX}" cy="${markerY}" r="6"/><text class="dl-chart-tick" x="${right - 3}" y="${bottom + 20}" text-anchor="end">입력 신호</text>`;
    $('activationInputValue').textContent = fmt(input, 1);
    $('activationName').textContent = `${name === 'relu' ? 'ReLU' : name === 'tanh' ? 'Tanh' : 'Sigmoid'} 출력`;
    $('activationOutput').textContent = fmt(output);
    $('activationDescription').textContent = settings.describe;
    $('activationGraph').setAttribute('aria-label', `${name} 활성화 함수 그래프. 입력 ${fmt(input, 1)}의 출력은 ${fmt(output)}입니다.`);
  }

  const forwardWeights = [[0.7, -0.5], [0.3, 0.8], [-0.6, 0.2]];
  const forwardBias = [0.05, -0.1, 0.2];
  const forwardOutputWeights = [0.9, -0.65, 0.4];
  function runForward(input, activationName) {
    const hidden = forwardWeights.map((row, index) => activate(activationName, row.reduce((sum, weight, i) => sum + weight * input[i], forwardBias[index])));
    const logit = hidden.reduce((sum, value, index) => sum + value * forwardOutputWeights[index], -0.1);
    const output = activate('sigmoid', logit);
    return { input, hidden, output };
  }

  function drawSmallNetwork(svg, layers, layerLabels, values, weights, options = {}) {
    const xPositions = [84, 380, 676];
    const yLayers = [valueY(layers[0], 102, 198), valueY(layers[1], 66, 234), valueY(layers[2], 150, 150)];
    const parts = ['<defs><marker id="backwardArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#16a08b"/></marker></defs>'];
    for (let layer = 0; layer < 2; layer += 1) {
      yLayers[layer].forEach((y1, from) => yLayers[layer + 1].forEach((y2, to) => {
        const weight = weights[layer][to][from];
        const active = Math.abs(weight) > 0.05;
        const gradient = options.gradients?.[layer]?.[to]?.[from] || 0;
        const classes = ['dl-network-edge', active ? 'is-active' : '', weight < 0 ? 'is-negative' : '', options.gradients ? 'is-gradient' : ''].filter(Boolean).join(' ');
        const width = options.gradients ? 1.1 + Math.min(3, Math.abs(gradient) * 24) : 1.1 + Math.min(2.2, Math.abs(weight));
        parts.push(`<line class="${classes}" x1="${xPositions[layer]}" y1="${y1}" x2="${xPositions[layer + 1]}" y2="${y2}" stroke-width="${width}"/>`);
      }));
    }
    if (options.backward) {
      yLayers[2].forEach(y2 => yLayers[1].forEach(y1 => parts.push(`<path d="M ${xPositions[2] - 24} ${y2 - 7} Q ${(xPositions[1] + xPositions[2]) / 2} ${(y1 + y2) / 2 - 8} ${xPositions[1] + 24} ${y1 - 7}" fill="none" stroke="#16a08b" stroke-width="1.6" stroke-dasharray="4 4" marker-end="url(#backwardArrow)" opacity=".72"/>`)));
    }
    yLayers.forEach((ys, layer) => {
      ys.forEach((y, index) => {
        const val = values[layer][index];
        const type = layer === 0 ? 'input' : layer === 2 ? 'output' : 'hidden';
        parts.push(`<circle class="dl-neuron dl-neuron--${type}" cx="${xPositions[layer]}" cy="${y}" r="21"/><text class="dl-neuron-value" x="${xPositions[layer]}" y="${y}">${fmt(val)}</text>`);
      });
      parts.push(`<text class="dl-layer-caption" x="${xPositions[layer]}" y="278">${layerLabels[layer]}</text>`);
    });
    svg.innerHTML = parts.join('');
  }

  function updateForward() {
    const input = [Number($('inputA').value), Number($('inputB').value)];
    const activationName = $('activationSelect').value;
    const result = runForward(input, activationName);
    const weights = [forwardWeights, [forwardOutputWeights]];
    drawSmallNetwork($('forwardGraph'), [2, 3, 1], ['입력층', '은닉층', '출력층'], [result.input, result.hidden, [result.output]], weights);
    $('inputAValue').textContent = fmt(input[0], 2);
    $('inputBValue').textContent = fmt(input[1], 2);
    $('forwardOutput').textContent = `${(result.output * 100).toFixed(1)}%`;
    $('forwardInterpretation').textContent = result.output >= 0.5 ? '이 고정 예시에서는 높은 출력 신호가 나타났어요.' : '이 고정 예시에서는 낮은 출력 신호가 나타났어요.';
    $('forwardDetails').innerHTML = `<span class="dl-value-chip">입력층 <strong>${result.input.map(v => fmt(v)).join(' · ')}</strong></span><span class="dl-value-chip">은닉층 <strong>${result.hidden.map(v => fmt(v)).join(' · ')}</strong></span><span class="dl-value-chip">출력층 <strong>${fmt(result.output)}</strong></span>`;
  }

  function freshBackpropModel() {
    return { w1: [[0.8, -0.4], [-0.5, 0.9]], b1: [0.1, -0.15], w2: [0.7, -0.6], b2: 0.08 };
  }
  let backpropModel = freshBackpropModel();
  let backpropSteps = 0;
  let lastGradients = null;

  function backpropForward(input) {
    const hidden = backpropModel.w1.map((row, j) => Math.tanh(row.reduce((sum, weight, i) => sum + weight * input[i], backpropModel.b1[j])));
    const logit = backpropModel.w2.reduce((sum, weight, j) => sum + weight * hidden[j], backpropModel.b2);
    return { input, hidden, output: 1 / (1 + Math.exp(-logit)) };
  }

  function updateBackprop() {
    const input = [Number($('backpropA').value), Number($('backpropB').value)];
    const result = backpropForward(input);
    const target = Number($('backpropTarget').value);
    const weights = [backpropModel.w1, [backpropModel.w2]];
    drawSmallNetwork($('backpropGraph'), [2, 2, 1], ['입력층', '은닉층', '출력층'], [input, result.hidden, [result.output]], weights, { backward: true, gradients: lastGradients });
    $('backpropAValue').textContent = fmt(input[0], 2);
    $('backpropBValue').textContent = fmt(input[1], 2);
    $('backpropSteps').textContent = `${backpropSteps}회`;
    $('backpropReadout').innerHTML = `<span class="dl-value-chip">현재 출력 <strong>${fmt(result.output)}</strong></span><span class="dl-value-chip">목표 <strong>${target === 1 ? '신호 있음' : '신호 없음'}</strong></span><span class="dl-value-chip">차이 <strong>${fmt(Math.abs(target - result.output))}</strong></span>`;
  }

  function doBackpropStep() {
    const input = [Number($('backpropA').value), Number($('backpropB').value)];
    const target = Number($('backpropTarget').value);
    const before = backpropForward(input);
    const outputDelta = (before.output - target) * before.output * (1 - before.output);
    const hiddenDeltas = before.hidden.map((value, j) => outputDelta * backpropModel.w2[j] * (1 - value * value));
    const gradW2 = before.hidden.map(value => outputDelta * value);
    const gradW1 = hiddenDeltas.map(delta => input.map(value => delta * value));
    const learningStep = 0.7;
    backpropModel.w2 = backpropModel.w2.map((weight, j) => weight - learningStep * gradW2[j]);
    backpropModel.b2 -= learningStep * outputDelta;
    backpropModel.w1 = backpropModel.w1.map((row, j) => row.map((weight, i) => weight - learningStep * gradW1[j][i]));
    backpropModel.b1 = backpropModel.b1.map((bias, j) => bias - learningStep * hiddenDeltas[j]);
    lastGradients = [gradW1, [gradW2]];
    backpropSteps += 1;
    const after = backpropForward(input);
    const oldDifference = Math.abs(target - before.output);
    const newDifference = Math.abs(target - after.output);
    updateBackprop();
    $('backpropMessage').textContent = `수정 전 출력 ${fmt(before.output)} → 수정 후 ${fmt(after.output)} · 목표와의 차이 ${fmt(oldDifference)} → ${fmt(newDifference)}. 강조된 연결은 이번 수정에서 계산된 몫을 보여줘요.`;
  }

  function resetBackprop() {
    backpropModel = freshBackpropModel();
    backpropSteps = 0;
    lastGradients = null;
    $('backpropMessage').textContent = '초기 가중치로 돌아왔어요. 입력과 목표를 바꿔 다시 살펴보세요.';
    updateBackprop();
  }

  function updateGradientFlow() {
    const depth = Number($('gradientDepth').value);
    const name = $('gradientActivation').value;
    const factor = name === 'relu' ? 1 : name === 'tanh' ? 0.55 : 0.25;
    const percent = 100 * Math.pow(factor, depth);
    $('gradientDepthValue').textContent = `${depth}층`;
    $('gradientFill').style.width = `${Math.max(percent > 0 ? 1 : 0, Math.min(100, percent))}%`;
    $('gradientPercent').textContent = percent < 0.001 ? '<0.001%' : `${percent.toFixed(percent < 1 ? 3 : 1)}%`;
    $('gradientExplanation').textContent = name === 'relu'
      ? `양수 경로를 따라가면 이 예시에서는 층마다 신호가 유지돼요. 입력이 음수인 ReLU 뉴런은 신호가 막힐 수 있어요.`
      : `단순 비교를 위해 층마다 ${Math.round(factor * 100)}%가 전달된다고 가정했어요. 층이 늘면 앞쪽으로 도달하는 신호가 빠르게 작아져요.`;
  }

  let dropoutMask = null;
  function updateDropout(newMask = false) {
    const rate = Number($('dropoutRate').value) / 100;
    const hiddenCount = 10;
    if (newMask || !dropoutMask) dropoutMask = Array.from({ length: hiddenCount }, () => Math.random() >= rate);
    const layers = [3, 5, 5, 2];
    const xs = [44, 188, 332, 476];
    const ys = layers.map(count => valueY(count, 42, 166));
    const parts = [];
    for (let layer = 0; layer < layers.length - 1; layer += 1) {
      ys[layer].forEach((y1, from) => ys[layer + 1].forEach((y2, to) => {
        const sourceActive = layer === 1 ? dropoutMask[from] : layer === 2 ? dropoutMask[5 + from] : true;
        const targetActive = layer + 1 === 1 ? dropoutMask[to] : layer + 1 === 2 ? dropoutMask[5 + to] : true;
        parts.push(`<line class="dl-network-edge ${sourceActive && targetActive ? '' : 'is-disabled'}" x1="${xs[layer]}" y1="${y1}" x2="${xs[layer + 1]}" y2="${y2}"/>`);
      }));
    }
    ys.forEach((yValues, layer) => yValues.forEach((y, index) => {
      const inactive = layer === 1 ? !dropoutMask[index] : layer === 2 ? !dropoutMask[5 + index] : false;
      const type = layer === 0 ? 'input' : layer === layers.length - 1 ? 'output' : inactive ? 'inactive' : 'hidden';
      parts.push(`<circle class="dl-neuron dl-neuron--${type}" cx="${xs[layer]}" cy="${y}" r="12"/>`);
    }));
    $('dropoutGraph').innerHTML = parts.join('');
    $('dropoutRateValue').textContent = `${Math.round(rate * 100)}%`;
    $('dropoutActive').textContent = `${dropoutMask.filter(Boolean).length}/10개`;
    $('dropoutGraph').setAttribute('aria-label', `Dropout ${Math.round(rate * 100)}퍼센트. 은닉 뉴런 10개 중 ${dropoutMask.filter(Boolean).length}개가 활동 중입니다.`);
  }

  function setComplete(isComplete = null) {
    let complete = Boolean(isComplete);
    const key = 'ain-progress:dl-01';
    try {
      complete = isComplete === null ? localStorage.getItem(key) === 'done' : isComplete;
      if (isComplete !== null) localStorage.setItem(key, complete ? 'done' : '');
    } catch {
      if (isComplete === null) complete = false;
    }
    const value = complete ? 100 : 0;
    $('progressTrack').setAttribute('aria-valuenow', String(value));
    $('progressFill').style.width = `${value}%`;
    $('progressLabel').textContent = complete ? '학습 완료' : '학습 진행도';
    $('progressPercent').textContent = `${value}%`;
    $('completeLesson').textContent = complete ? '완료 표시 해제' : '이 차시 학습 완료';
    $('completeLesson').setAttribute('aria-pressed', String(complete));
  }

  function applySearch() {
    const query = $('Search-bar').value.trim().toLocaleLowerCase('ko');
    let visibleCount = 0;
    sections.forEach(section => {
      const matches = !query || section.textContent.toLocaleLowerCase('ko').includes(query);
      section.hidden = !matches;
      visibleCount += Number(matches);
    });
    navLinks.forEach(link => {
      const section = document.getElementById(link.dataset.navSection);
      link.hidden = Boolean(query && section?.hidden);
    });
    $('searchEmpty').hidden = !query || visibleCount > 0;
    updateActiveSection();
  }

  function updateActiveSection() {
    const readingLine = 155;
    const current = [...sections].filter(section => !section.hidden && section.getBoundingClientRect().top <= readingLine).at(-1);
    if (!current && window.scrollY < 100) {
      navLinks.forEach(link => link.classList.toggle('is-active', link.dataset.navSection === 'network'));
      return;
    }
    if (current) navLinks.forEach(link => link.classList.toggle('is-active', link.dataset.navSection === current.id));
  }

  let scrollQueued = false;
  window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(() => { updateActiveSection(); scrollQueued = false; });
  }, { passive: true });
  window.addEventListener('resize', updateActiveSection);
  $('Search-bar').addEventListener('input', applySearch);
  document.addEventListener('keydown', event => {
    const target = event.target;
    const typing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    if ((event.key === '/' || (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey))) && !typing) {
      event.preventDefault();
      $('Search-bar').focus();
    }
    if (event.key === 'Escape' && document.activeElement === $('Search-bar')) {
      $('Search-bar').value = '';
      applySearch();
      $('Search-bar').blur();
    }
  });
  navLinks.forEach(link => link.addEventListener('click', () => {
    const target = document.getElementById(link.dataset.navSection);
    if (target?.hidden) {
      $('Search-bar').value = '';
      applySearch();
    }
  }));

  $('depthControl').addEventListener('input', renderArchitecture);
  $('widthControl').addEventListener('input', renderArchitecture);
  $('activationSelect').addEventListener('change', () => { renderActivation(); updateForward(); });
  $('activationInput').addEventListener('input', renderActivation);
  ['inputA', 'inputB'].forEach(id => $(id).addEventListener('input', updateForward));
  ['backpropA', 'backpropB', 'backpropTarget'].forEach(id => $(id).addEventListener('input', () => {
    lastGradients = null;
    $('backpropMessage').textContent = '입력이나 목표가 바뀌었어요. 새 조건으로 오차를 거슬러 살펴보세요.';
    updateBackprop();
  }));
  $('backpropStep').addEventListener('click', doBackpropStep);
  $('backpropReset').addEventListener('click', resetBackprop);
  ['gradientDepth', 'gradientActivation'].forEach(id => $(id).addEventListener('input', updateGradientFlow));
  $('dropoutRate').addEventListener('input', () => updateDropout(true));
  $('dropoutResample').addEventListener('click', () => updateDropout(true));
  $('completeLesson').addEventListener('click', () => setComplete($('completeLesson').getAttribute('aria-pressed') !== 'true'));

  renderArchitecture();
  renderActivation();
  updateForward();
  updateBackprop();
  updateGradientFlow();
  updateDropout(true);
  setComplete();
})();
