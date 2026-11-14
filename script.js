'use strict';
(() => {
  const $ = (selector) => document.querySelector(selector);
  const data = window.SCIENCE_DATA;
  const figures = window.FIGURES;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let selectedFigure = figures[0];
  let frameIndex = 0;
  let scoreIndex = 0;
  let timer = null;

  // Native links and a small mobile menu keep every section available without a router.
  $('.menu-toggle').addEventListener('click', () => {
    const expanded = $('.menu-toggle').getAttribute('aria-expanded') !== 'true';
    $('.menu-toggle').setAttribute('aria-expanded', String(expanded));
    $('#navigation').classList.toggle('is-open', expanded);
  });
  $('#navigation').querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    $('#navigation').classList.remove('is-open');
    $('.menu-toggle').setAttribute('aria-expanded', 'false');
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && $('#navigation').classList.contains('is-open')) {
      $('#navigation').classList.remove('is-open');
      $('.menu-toggle').setAttribute('aria-expanded', 'false');
      $('.menu-toggle').focus();
    }
  });
  const navigationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      $('#navigation').querySelectorAll('a').forEach((link) => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin: '-15% 0px -60% 0px'});
  ['overview', 'model', 'evidence', 'interactive', 'figures'].forEach((id) => navigationObserver.observe(document.getElementById(id)));

  function paragraphNodes(text) {
    const fragment = document.createDocumentFragment();
    text.split(/\n\n+/).forEach((part) => {
      const p = document.createElement('p');
      part.split('\n').forEach((line, i) => {
        if (i) p.append(document.createElement('br'));
        p.append(document.createTextNode(line));
      });
      fragment.append(p);
    });
    return fragment;
  }
  $('#letter-body').append(paragraphNodes(window.COVER_LETTER));
  $('#print-letter').addEventListener('click', () => window.print());

  function selectFigure(id, updateLocation = false) {
    const figure = figures.find((f) => f.id === id);
    if (!figure) return;
    selectedFigure = figure;
    $('#figure-kicker').textContent = figure.label;
    $('#figure-title').textContent = figure.title;
    $('#figure-image').src = figure.image;
    $('#figure-image').alt = `${figure.label}: ${figure.title}`;
    $('#figure-pdf').href = figure.pdf;
    $('#figure-pdf').textContent = `Open ${figure.format || 'PDF'} ↗`;
    $('#figure-pdf').setAttribute('aria-label', `Open ${figure.label} ${figure.format || 'PDF'}`);
    $('#figure-panel').setAttribute('aria-labelledby', `tab-${figure.id}`);
    $('#figure-legend').replaceChildren(paragraphNodes(figure.legend));
    $('#figure-tabs').querySelectorAll('button').forEach((button) => {
      const active = button.dataset.figure === id;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    if (updateLocation) history.replaceState(null, '', `#${id}`);
  }
  figures.forEach((figure, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'figure-tab';
    button.id = `tab-${figure.id}`;
    button.dataset.figure = figure.id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'figure-panel');
    const label = document.createElement('span');
    label.textContent = figure.label;
    const title = document.createElement('strong');
    title.textContent = figure.short;
    button.append(label, title);
    button.addEventListener('click', () => selectFigure(figure.id, true));
    button.addEventListener('keydown', (event) => {
      let next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % figures.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + figures.length) % figures.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = figures.length - 1;
      else return;
      event.preventDefault();
      selectFigure(figures[next].id, true);
      $(`#tab-${figures[next].id}`).focus();
    });
    $('#figure-tabs').append(button);
  });
  function openFigure(id) {
    if (id) selectFigure(id);
    $('#dialog-title').textContent = `${selectedFigure.label} · ${selectedFigure.title}`;
    $('#dialog-image').src = selectedFigure.image;
    $('#dialog-image').alt = `${selectedFigure.label}: ${selectedFigure.title}`;
    if (!$('#image-dialog').open) $('#image-dialog').showModal();
    document.body.style.overflow = 'hidden';
  }
  $('.figure-image-button').addEventListener('click', () => openFigure());
  $('#enlarge-figure').addEventListener('click', () => openFigure());
  document.querySelectorAll('.open-figure').forEach((button) => button.addEventListener('click', () => openFigure(button.dataset.figure)));
  document.querySelectorAll('[data-select-figure]').forEach((link) => link.addEventListener('click', () => selectFigure(link.dataset.selectFigure)));
  $('#close-dialog').addEventListener('click', () => $('#image-dialog').close());
  $('#image-dialog').addEventListener('close', () => { document.body.style.overflow = ''; });
  $('#image-dialog').addEventListener('click', (event) => {
    if (event.target !== $('#image-dialog')) return;
    const bounds = $('#image-dialog').getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) $('#image-dialog').close();
  });
  function readHash() {
    const id = location.hash.slice(1);
    if (figures.some((f) => f.id === id)) {
      selectFigure(id);
      $('#figures').scrollIntoView({behavior: 'instant'});
    }
  }
  selectFigure('figure2');
  window.addEventListener('hashchange', readHash);
  if (location.hash.startsWith('#figure')) requestAnimationFrame(readHash);

  // Plot only cached numerical values; no synthetic trajectories or fitted browser curves.
  // One renderer serves three cached datasets; switching only swaps the data and labels.
  const datasets = [
    {
      key: 'ipsc',
      tab: 'Targeted iPSC',
      kicker: 'iPSC · day 0–5',
      badge: 'RT-qPCR · 96 genes',
      axisX: 'UMAP 1',
      axisY: 'UMAP 2',
      projection: 'UMAP',
      timeUnit: 'day',
      timeMin: 0,
      timeMax: 5,
      timeTicks: [0, 1, 2, 3, 4, 5],
      scoreMax: 9,
      scoreTick: 2,
      scoreHeading: 'Transition score',
      scoreSymbol: 'C(t)',
      scoreLegend: '32-rollout mean',
      scoreNote: 'The score and displayed populations are separate cached reconstructions.',
      peakTime: 2.325,
      peakLabel: 'Day 2.325',
      window: [1.95, 2.4],
      windowLabel: 'Primary window · days 1.95–2.4',
      observedLegend: 'All observed cells',
      footnote: 'Displayed populations are reconstructed snapshots, not tracked descendants. Intermediate frames have 0.5-day spacing; the score has 0.025-day spacing. The full time course contributed to model fitting.',
      data: window.SCIENCE_DATA
    },
    {
      key: 'endoderm',
      tab: 'Endoderm',
      kicker: 'GSE75748 · 0–96 h',
      badge: 'Time course · 6 stages',
      axisX: 'PC 1',
      axisY: 'PC 2',
      projection: 'PC',
      timeUnit: 'h',
      timeMin: 0,
      timeMax: 96,
      timeTicks: [0, 12, 24, 36, 48, 60, 72, 84, 96],
      scoreMax: 3,
      scoreTick: 1,
      scoreHeading: 'Transition score',
      scoreSymbol: 'C(t)',
      scoreLegend: '32-rollout mean',
      scoreNote: 'The score and displayed populations are separate cached reconstructions.',
      peakTime: 28.2,
      peakLabel: '28.2 h',
      window: [24.6, 28.2],
      windowLabel: 'Primary window · 24.6–28.2 h',
      observedLegend: 'All observed cells',
      footnote: 'Displayed populations are reconstructed snapshots, not tracked descendants. Intermediate frames have 6-hour spacing; the score has 0.6-hour spacing. The full time course contributed to model fitting.',
      data: window.SCIENCE_DATA_ENDODERM
    },
    {
      key: 'emt',
      tab: 'EMT/MET',
      kicker: 'EMT/MET · day 7–30',
      badge: 'Time course · 5 stages',
      axisX: 'PC 1',
      axisY: 'PC 2',
      projection: 'PC',
      timeUnit: 'day',
      timeMin: 7,
      timeMax: 30,
      timeTicks: [10, 15, 20, 25, 30],
      scoreMax: 1.4,
      scoreTick: 0.5,
      scoreHeading: 'Transition indicator',
      scoreSymbol: 'I(t)',
      scoreLegend: 'causal trailing window · day 7 = 1',
      scoreNote: 'The indicator and displayed populations are separate cached reconstructions.',
      peakTime: 22.5,
      peakLabel: 'Day 22.5',
      window: [19.9, 22.5],
      windowLabel: 'Critical window · days 19.9–22.5',
      observedLegend: 'All observed cells',
      footnote: 'Displayed populations are reconstructed snapshots, not tracked descendants. Intermediate frames have 1-day spacing; the indicator uses a trailing 2.5-day window and is normalized to the first displayed day (day 7 = 1) during calculation, so no future information enters I(t). The full time course contributed to model fitting.',
      data: window.SCIENCE_DATA_EMT_MET
    }
  ].filter((entry) => entry.data);

  const palette = ['#834e99', '#795ba6', '#705ead', '#566fab', '#358697', '#339c8a', '#58b66f', '#76c653', '#9ccf35', '#c4d833', '#e4df24'];
  const paletteRgb = palette.map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
  function frameColor(index, count) {
    if (count <= 1) return palette[0];
    const position = index / (count - 1) * (paletteRgb.length - 1);
    const low = Math.floor(position);
    const high = Math.min(low + 1, paletteRgb.length - 1);
    const mix = position - low;
    const rgb = paletteRgb[low].map((value, channel) => Math.round(value + (paletteRgb[high][channel] - value) * mix));
    return `rgb(${rgb.join(',')})`;
  }

  const canvas = $('#population-plot');
  const svg = $('#score-plot');
  const ns = 'http://www.w3.org/2000/svg';
  const observedLayer = document.createElement('canvas');
  let current = datasets[0];
  let xmin = 0, xmax = 1, ymin = 0, ymax = 1;
  let scoreX = () => 0, scoreY = () => 0, cursor, cursorDot;

  function svgElement(tag, attributes, text) {
    const element = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function frameTimeLabel(value) {
    return current.timeUnit === 'h' ? `${value.toFixed(0)} h` : `Day ${value.toFixed(1)}`;
  }
  function scoreTimeLabel(value) {
    if (current.timeUnit === 'h') return `${value.toFixed(1)} h`;
    return `Day ${value.toFixed(current.key === 'emt' ? 2 : 3)}`;
  }
  function nearestCurveIndex(value) {
    return current.data.curve.reduce((best, row, i) => Math.abs(row[0] - value) < Math.abs(current.data.curve[best][0] - value) ? i : best, 0);
  }
  function computeBounds() {
    const points = current.data.observed.concat(current.data.frames.flatMap((frame) => frame.points));
    xmin = Infinity; xmax = -Infinity; ymin = Infinity; ymax = -Infinity;
    for (const [x, y] of points) { xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
    const xpad = (xmax - xmin) * .09, ypad = (ymax - ymin) * .1;
    xmin -= xpad; xmax += xpad; ymin -= ypad; ymax += ypad;
  }
  function plotX(value) { return 52 + (value - xmin) / (xmax - xmin) * 560; }
  function plotY(value) { return 365 - (value - ymin) / (ymax - ymin) * 337; }
  function buildObservedLayer() {
    const width = 640, height = 420;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    observedLayer.width = width * dpr;
    observedLayer.height = height * dpr;
    const ctx = observedLayer.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#dfe2e9';
    for (const point of current.data.observed) {
      ctx.beginPath(); ctx.arc(plotX(point[0]), plotY(point[1]), 1.9, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawPopulation() {
    const width = 640, height = 420;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr; canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.drawImage(observedLayer, 0, 0, width, height);
    ctx.strokeStyle = '#d7dfeb'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(52, 25); ctx.lineTo(52, 365); ctx.lineTo(612, 365); ctx.stroke();
    ctx.fillStyle = '#7a8497'; ctx.font = '13px Arial'; ctx.textAlign = 'center';
    ctx.fillText(current.axisX, 335, 407);
    ctx.save(); ctx.translate(18, 198); ctx.rotate(-Math.PI / 2); ctx.fillText(current.axisY, 0, 0); ctx.restore();
    const frame = current.data.frames[frameIndex];
    const color = frameColor(frameIndex, current.data.frames.length);
    ctx.globalAlpha = .8;
    ctx.fillStyle = color;
    for (const point of frame.points) {
      ctx.beginPath(); ctx.arc(plotX(point[0]), plotY(point[1]), 2.65, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const label = frameTimeLabel(frame.time);
    $('#frame-day').textContent = label;
    $('#frame-day').style.color = color;
    const measured = current.data.measurementTimes.includes(frame.time);
    $('#frame-note').textContent = `${frame.points.length} simulated particles · ${measured ? 'measured stage' : 'unmeasured intermediate stage'}`;
    canvas.setAttribute('aria-label', `${frame.points.length} reconstructed particles at ${label} on the fixed ${current.projection} reference, against ${current.data.observed.length} observed cells. ${measured ? 'Measurements exist at this stage.' : 'This intermediate stage was not sampled.'}`);
    $('.plot-key .purple').style.background = color;
  }
  function renderScore() {
    const meta = current, data = meta.data;
    svg.replaceChildren();
    scoreX = (value) => 55 + (value - meta.timeMin) / (meta.timeMax - meta.timeMin) * 555;
    scoreY = (value) => 365 - value / meta.scoreMax * 328;
    const path = data.curve.map((row, i) => `${i ? 'L' : 'M'}${scoreX(row[0]).toFixed(3)},${scoreY(row[1]).toFixed(3)}`).join(' ');
    svg.append(svgElement('rect', {x: scoreX(meta.window[0]), y: 37, width: Math.max(scoreX(meta.window[1]) - scoreX(meta.window[0]), 1), height: 328, fill: '#f2eaf7'}));
    for (let value = 0; value <= meta.scoreMax + 1e-9; value += meta.scoreTick) {
      svg.append(svgElement('line', {x1: 55, x2: 610, y1: scoreY(value), y2: scoreY(value), stroke: '#e8ecf3'}));
      svg.append(svgElement('text', {x: 42, y: scoreY(value) + 4, fill: '#778196', 'text-anchor': 'end', 'font-size': 12}, Number(value.toFixed(2))));
    }
    for (const tick of meta.timeTicks) {
      svg.append(svgElement('text', {x: scoreX(tick), y: 386, fill: '#778196', 'text-anchor': 'middle', 'font-size': 12}, tick));
    }
    svg.append(svgElement('text', {x: 330, y: 412, fill: '#778196', 'text-anchor': 'middle', 'font-size': 13}, `Time (${meta.timeUnit})`));
    svg.append(svgElement('text', {transform: 'translate(15,200) rotate(-90)', fill: '#778196', 'text-anchor': 'middle', 'font-size': 13}, meta.scoreHeading));
    svg.append(svgElement('path', {d: path, fill: 'none', stroke: '#8850a4', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
    const peak = data.curve[nearestCurveIndex(meta.peakTime)];
    const anchor = scoreX(peak[0]) > 520 ? 'end' : 'start';
    const offset = anchor === 'end' ? -15 : 15;
    svg.append(svgElement('circle', {cx: scoreX(peak[0]), cy: scoreY(peak[1]), r: 4.5, fill: '#8850a4'}));
    svg.append(svgElement('text', {x: scoreX(peak[0]) + offset, y: scoreY(peak[1]) - 12, fill: '#83559c', 'font-size': 13, 'font-weight': 600, 'text-anchor': anchor}, meta.peakLabel));
    cursor = svgElement('line', {x1: 55, x2: 55, y1: 37, y2: 365, stroke: '#7b8ba5', 'stroke-width': 1.2, 'stroke-dasharray': '4 5'});
    cursorDot = svgElement('circle', {cx: 55, cy: scoreY(1), r: 5, fill: '#fff', stroke: '#8750a3', 'stroke-width': 2.5});
    svg.append(cursor, cursorDot);
    svg.setAttribute('aria-label', `${meta.scoreHeading} over ${meta.timeUnit === 'h' ? `0–${meta.timeMax} h` : `day ${meta.timeMin}–${meta.timeMax}`}, with a maximum at ${meta.peakLabel}`);
    updateScore(nearestCurveIndex(meta.peakTime));
  }
  function updateScore(index) {
    scoreIndex = index;
    const row = current.data.curve[index];
    if (!row || !cursor) return;
    cursor.setAttribute('x1', scoreX(row[0])); cursor.setAttribute('x2', scoreX(row[0]));
    cursorDot.setAttribute('cx', scoreX(row[0])); cursorDot.setAttribute('cy', scoreY(row[1]));
    $('#score-value').textContent = `${current.scoreSymbol} = ${row[1].toFixed(2)}`;
    if ($('#score-slider')) $('#score-slider').value = index;
    $('#score-slider')?.setAttribute('aria-valuetext', `${scoreTimeLabel(row[0])}, ${current.scoreHeading.toLowerCase()} ${row[1].toFixed(3)}`);
  }
  function updateFrame(index) {
    frameIndex = Math.max(0, Math.min(index, current.data.frames.length - 1));
    const time = current.data.frames[frameIndex].time;
    $('#time-slider').value = frameIndex;
    const label = frameTimeLabel(time);
    $('#time-output').textContent = label;
    $('#time-slider').setAttribute('aria-valuetext', label);
    drawPopulation();
    updateScore(nearestCurveIndex(time));
  }
  function stop() {
    window.clearInterval(timer); timer = null;
    $('#play').textContent = '▶ Play'; $('#play').setAttribute('aria-label', 'Play population reconstruction');
  }
  function selectDataset(key) {
    const next = datasets.find((entry) => entry.key === key) || datasets[0];
    stop();
    current = next;
    frameIndex = 0;
    $('#dataset-kicker').textContent = next.kicker;
    $('#dataset-badge').textContent = next.badge;
    $('#observed-legend').textContent = next.observedLegend;
    $('#score-heading').textContent = next.scoreHeading;
    $('#score-legend').textContent = next.scoreLegend;
    $('#window-legend').textContent = next.windowLabel;
    $('#score-note').textContent = next.scoreNote;
    $('#explorer-footnote').textContent = next.footnote;
    $('#dataset-tabs').querySelectorAll('button').forEach((button) => {
      const active = button.dataset.dataset === next.key;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $('#explorer-panel').setAttribute('aria-labelledby', `tab-dataset-${next.key}`);
    $('#time-slider').max = next.data.frames.length - 1;
    computeBounds();
    buildObservedLayer();
    renderScore();
    updateFrame(0);
  }
  datasets.forEach((entry, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dataset-tab';
    button.id = `tab-dataset-${entry.key}`;
    button.dataset.dataset = entry.key;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'explorer-panel');
    button.setAttribute('aria-selected', 'false');
    button.textContent = entry.tab;
    button.addEventListener('click', () => selectDataset(entry.key));
    button.addEventListener('keydown', (event) => {
      let next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % datasets.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + datasets.length) % datasets.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = datasets.length - 1;
      else return;
      event.preventDefault();
      selectDataset(datasets[next].key);
      $(`#tab-dataset-${datasets[next].key}`).focus();
    });
    $('#dataset-tabs').append(button);
  });
  $('#time-slider').addEventListener('input', (event) => { stop(); updateFrame(Number(event.target.value)); });
  $('#score-slider')?.addEventListener('input', (event) => { stop(); updateScore(Number(event.target.value)); });
  $('#peak').addEventListener('click', () => {
    stop();
    updateScore(nearestCurveIndex(current.peakTime));
  });
  $('#play').addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (frameIndex === current.data.frames.length - 1) updateFrame(0);
    $('#play').textContent = 'Ⅱ Pause'; $('#play').setAttribute('aria-label', 'Pause population reconstruction');
    timer = window.setInterval(() => {
      if (frameIndex === current.data.frames.length - 1) { stop(); return; }
      updateFrame(frameIndex + 1);
    }, motionPreference.matches ? 1600 : 850);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  new IntersectionObserver((entries) => { if (!entries[0].isIntersecting) stop(); }, {threshold: .1}).observe($('.explorer'));
  selectDataset(datasets[0].key);
})();
