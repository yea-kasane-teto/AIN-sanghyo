(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const sections = [...document.querySelectorAll('[data-searchable]')];
  const navLinks = [...document.querySelectorAll('[data-nav-section]')];
  const fmt = (value, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : '0.00';

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
    const parts = [`<defs><marker id="${svg.id}-backwardArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#16a08b"/></marker></defs>`];
    for (let layer = 0; layer < 2; layer += 1) {
      yLayers[layer].forEach((y1, from) => yLayers[layer + 1].forEach((y2, to) => {
        const weight = weights[layer][to][from];
        const active = Math.abs(weight) > 0.05;
        const gradient = options.gradients?.[layer]?.[to]?.[from] || 0;
        const classes = ['dl-network-edge', active ? 'is-active' : '', weight < 0 ? 'is-negative' : '', options.gradients ? 'is-gradient' : ''].filter(Boolean).join(' ');
        const width = options.gradients ? 1.1 + Math.min(3, Math.abs(gradient) * 24) : 1.1 + Math.min(2.2, Math.abs(weight));
        parts.push(`<line class="${classes}" x1="${xPositions[layer]}" y1="${y1}" x2="${xPositions[layer + 1]}" y2="${y2}" style="stroke-width:${width}"/>`);
      }));
    }
    if (options.backward) {
      for (let layer = 2; layer > 0; layer -= 1) {
        yLayers[layer].forEach(y2 => yLayers[layer - 1].forEach(y1 => parts.push(`<path d="M ${xPositions[layer] - 24} ${y2 - 7} Q ${(xPositions[layer - 1] + xPositions[layer]) / 2} ${(y1 + y2) / 2 - 8} ${xPositions[layer - 1] + 24} ${y1 - 7}" fill="none" stroke="#16a08b" stroke-width="1.6" stroke-dasharray="4 4" marker-end="url(#${svg.id}-backwardArrow)" opacity=".72"/>`)));
      }
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
    const activationName = $('forwardActivation').value;
    const result = runForward(input, activationName);
    const weights = [forwardWeights, [forwardOutputWeights]];
    drawSmallNetwork($('forwardGraph'), [2, 3, 1], ['입력층', '은닉층', '출력층'], [result.input, result.hidden, [result.output]], weights);
    $('inputAValue').textContent = fmt(input[0], 2);
    $('inputBValue').textContent = fmt(input[1], 2);
    $('forwardOutput').textContent = fmt(result.output, 4);
    $('forwardInterpretation').textContent = '고정 파라미터로 계산한 출력이에요. 학습된 확률이나 정확도가 아니에요.';
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
    const loss = 0.5 * (result.output - target) ** 2;
    const weights = [backpropModel.w1, [backpropModel.w2]];
    drawSmallNetwork($('backpropGraph'), [2, 2, 1], ['입력층', '은닉층 · Tanh', '출력층 · Sigmoid'], [input, result.hidden, [result.output]], weights, { backward: true, gradients: lastGradients });
    $('backpropAValue').textContent = fmt(input[0], 2);
    $('backpropBValue').textContent = fmt(input[1], 2);
    $('backpropSteps').textContent = `${backpropSteps}회`;
    $('backpropReadout').innerHTML = `<span class="dl-value-chip">현재 출력 <strong>${fmt(result.output, 4)}</strong></span><span class="dl-value-chip">목표 <strong>${target}</strong></span><span class="dl-value-chip">손실 L <strong data-backprop-loss="${loss}">${fmt(loss, 6)}</strong></span>`;
    if (lastGradients) $('backpropReadout').insertAdjacentHTML('beforeend', `<span class="dl-value-chip">직전 ∂L/∂w₁₁ <strong>${fmt(lastGradients[0][0][0], 6)}</strong></span>`);
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
    const oldLoss = 0.5 * (before.output - target) ** 2;
    const newLoss = 0.5 * (after.output - target) ** 2;
    updateBackprop();
    $('backpropMessage').textContent = `η = 0.7로 업데이트했어요. 손실 ${fmt(oldLoss, 6)} → ${fmt(newLoss, 6)}. 첫 은닉 가중치 w₁₁의 기울기 ${fmt(gradW1[0][0], 6)}, 변화량 ${fmt(-learningStep * gradW1[0][0], 6)}. 그림의 선은 업데이트 전 기울기, 노드는 업데이트 후 출력이에요.`;
  }

  function resetBackprop() {
    backpropModel = freshBackpropModel();
    backpropSteps = 0;
    lastGradients = null;
    $('backpropMessage').textContent = '초기 가중치로 돌아왔어요. η = 0.7, L = ½(출력 − 목표)²로 학습해요.';
    updateBackprop();
  }

  function updateGradientFlow() {
    const depth = Number($('gradientDepth').value);
    const name = $('gradientActivation').value;
    const z = Number($('gradientSignal').value);
    const activation = activate(name, z);
    const derivative = name === 'relu' ? (z > 0 ? 1 : 0) : name === 'tanh' ? 1 - activation ** 2 : activation * (1 - activation);
    const ratio = derivative ** depth;
    const percent = 100 * ratio;
    const precise = value => value !== 0 && Math.abs(value) < 0.001 ? value.toExponential(3) : fmt(value, 4);
    $('gradientDepthValue').textContent = `${depth}층`;
    $('gradientSignalValue').textContent = fmt(z, 1);
    $('gradientFill').style.width = `${percent}%`;
    $('gradientPercent').textContent = `${precise(percent)}%`;
    $('gradientExplanation').textContent = `각 층의 f′(${fmt(z, 1)}) = ${precise(derivative)}. 미분의 곱 [f′(z)]^${depth} = ${precise(ratio)}예요. 가중치는 모두 1이고, 각 층의 z가 같도록 편향을 설정한 단일 경로의 계산이에요.${name === 'relu' && z === 0 ? ' ReLU는 0에서 미분 불가능하며, 이 구현은 미분값 0을 선택해요.' : ''}`;
  }

  let dropoutMask = null;
  function updateDropout(newMask = false) {
    const rate = Number($('dropoutRate').value) / 100;
    const hiddenCount = 10;
    if (newMask || !dropoutMask) dropoutMask = Array.from({ length: hiddenCount }, () => Math.random() >= rate);
    const training = $('dropoutMode').value === 'train';
    const mask = training ? dropoutMask : Array(hiddenCount).fill(true);
    const layers = [3, 5, 5, 2];
    const xs = [44, 188, 332, 476];
    const ys = layers.map(count => valueY(count, 42, 166));
    const parts = [];
    for (let layer = 0; layer < layers.length - 1; layer += 1) {
      ys[layer].forEach((y1, from) => ys[layer + 1].forEach((y2, to) => {
        const sourceActive = layer === 1 ? mask[from] : layer === 2 ? mask[5 + from] : true;
        const targetActive = layer + 1 === 1 ? mask[to] : layer + 1 === 2 ? mask[5 + to] : true;
        parts.push(`<line class="dl-network-edge ${sourceActive && targetActive ? '' : 'is-disabled'}" x1="${xs[layer]}" y1="${y1}" x2="${xs[layer + 1]}" y2="${y2}"/>`);
      }));
    }
    ys.forEach((yValues, layer) => yValues.forEach((y, index) => {
      const inactive = layer === 1 ? !mask[index] : layer === 2 ? !mask[5 + index] : false;
      const type = layer === 0 ? 'input' : layer === layers.length - 1 ? 'output' : inactive ? 'inactive' : 'hidden';
      parts.push(`<circle class="dl-neuron dl-neuron--${type}" cx="${xs[layer]}" cy="${y}" r="12"/>`);
    }));
    $('dropoutGraph').innerHTML = parts.join('');
    $('dropoutResample').disabled = !training;
    $('dropoutRate').disabled = !training;
    $('dropoutExplanation').textContent = training
      ? `학습 모드: 각 은닉 출력이 ${Math.round(rate * 100)}% 확률로 0이 돼요. 살아남은 출력에는 1/(1−p) = ${fmt(1 / (1 - rate), 3)}배를 적용해요. 그림은 마스크만 표시해요.`
      : '추론 모드: Dropout을 끄고 모든 출력을 그대로 사용해요. 학습 중에 이미 배율을 적용했으므로 추론 시 추가 배율은 없어요.';
    $('dropoutRateValue').textContent = `${Math.round(rate * 100)}%`;
    $('dropoutActive').textContent = `${mask.filter(Boolean).length}/10개`;
    $('dropoutGraph').setAttribute('aria-label', `${training ? '학습' : '추론'} 모드. Dropout 설정 ${Math.round(rate * 100)}퍼센트. 은닉 뉴런 10개 중 ${mask.filter(Boolean).length}개가 활동 중입니다.`);
  }

  let descentWeight = 3;
  let descentSteps = 0;
  let descentHistory = [];
  function renderDescent() {
    const loss = 0.5 * (descentWeight - 1) ** 2;
    $('descentReadout').innerHTML = `<span class="dl-value-chip">스텝 <strong>${descentSteps}</strong></span><span class="dl-value-chip">w <strong>${fmt(descentWeight, 4)}</strong></span><span class="dl-value-chip">현재 기울기 <strong>${fmt(descentWeight - 1, 4)}</strong></span><span class="dl-value-chip">손실 J <strong>${fmt(loss, 6)}</strong></span>`;
    $('descentHistory').innerHTML = descentHistory.map(row => `<li>${row}</li>`).join('');
    $('descentHistory').start = Math.max(1, descentSteps - descentHistory.length + 1);
    const stopped = Math.abs(descentWeight) >= 10000;
    $('descentStep').disabled = stopped;
    $('descentMessage').textContent = stopped ? '발산으로 |w|가 10,000 이상이 되어 이 예시의 반복을 멈췄어요. 학습률을 줄여 처음부터 비교해 보세요.' : `J(w) = ½(w − 1)²의 최솟값은 w = 1에서 0이에요. 현재 학습률 η = ${$('descentRate').value}. 최근 5회 계산을 표시해요.`;
  }
  function stepDescent() {
    if (Math.abs(descentWeight) >= 10000) return;
    const before = descentWeight;
    const gradient = before - 1;
    const rate = Number($('descentRate').value);
    descentWeight = before - rate * gradient;
    descentSteps += 1;
    descentHistory.push(`w: ${fmt(before, 4)} − ${rate} × (${fmt(gradient, 4)}) = ${fmt(descentWeight, 4)} · J = ${fmt(0.5 * (descentWeight - 1) ** 2, 6)}`);
    descentHistory = descentHistory.slice(-5);
    renderDescent();
  }
  function resetDescent() {
    descentWeight = 3;
    descentSteps = 0;
    descentHistory = [];
    renderDescent();
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

  const detailsBeforeSearch = new Map();
  function applySearch() {
    const query = $('Search-bar').value.trim().toLocaleLowerCase('ko');
    const details = [...document.querySelectorAll('.dl-supplement')];
    if (query && detailsBeforeSearch.size === 0) details.forEach(detail => detailsBeforeSearch.set(detail, detail.open));
    let visibleCount = 0;
    sections.forEach(section => {
      const matches = !query || section.textContent.toLocaleLowerCase('ko').includes(query);
      section.hidden = !matches;
      visibleCount += Number(matches);
    });
    details.forEach(detail => {
      if (query) detail.open = detail.textContent.toLocaleLowerCase('ko').includes(query);
      else if (detailsBeforeSearch.has(detail)) detail.open = detailsBeforeSearch.get(detail);
    });
    if (!query) detailsBeforeSearch.clear();
    navLinks.forEach(link => {
      link.hidden = Boolean(query && $(link.dataset.navSection)?.hidden);
    });
    $('searchEmpty').hidden = !query || visibleCount > 0;
    updateActiveSection();
  }

  function updateActiveSection() {
    const visible = sections.filter(section => !section.hidden);
    const readingLine = Math.max(120, document.querySelector('.topbar').getBoundingClientRect().bottom + 24);
    const current = visible.filter(section => section.getBoundingClientRect().top <= readingLine).at(-1) || visible[0];
    navLinks.forEach(link => {
      const active = link.dataset.navSection === current?.id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
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
  $('activationSelect').addEventListener('change', renderActivation);
  $('forwardActivation').addEventListener('change', updateForward);
  $('activationInput').addEventListener('input', renderActivation);
  ['inputA', 'inputB'].forEach(id => $(id).addEventListener('input', updateForward));
  ['backpropA', 'backpropB', 'backpropTarget'].forEach(id => $(id).addEventListener('input', () => {
    lastGradients = null;
    $('backpropMessage').textContent = '입력이나 목표가 바뀌었어요. 현재 가중치는 유지돼요. 새 조건에서 역전파를 계산하거나 초기 상태로 되돌려 비교해 보세요.';
    updateBackprop();
  }));
  $('backpropStep').addEventListener('click', doBackpropStep);
  $('backpropReset').addEventListener('click', resetBackprop);
  ['gradientDepth', 'gradientActivation', 'gradientSignal'].forEach(id => $(id).addEventListener('input', updateGradientFlow));
  $('dropoutMode').addEventListener('change', () => updateDropout());
  $('descentRate').addEventListener('change', resetDescent);
  $('descentStep').addEventListener('click', stepDescent);
  $('descentReset').addEventListener('click', resetDescent);
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
  renderDescent();
  updateActiveSection();
})();
