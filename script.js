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
  const palette = ['#834e99', '#795ba6', '#705ead', '#566fab', '#358697', '#339c8a', '#58b66f', '#76c653', '#9ccf35', '#c4d833', '#e4df24'];
  const allPoints = data.observed.concat(data.frames.flatMap((frame) => frame.points));
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (const [x, y] of allPoints) { xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
  const xpad = (xmax - xmin) * .09, ypad = (ymax - ymin) * .1;
  xmin -= xpad; xmax += xpad; ymin -= ypad; ymax += ypad;
  const canvas = $('#population-plot');
  function drawPopulation() {
    const width = 640, height = 420;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr; canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
    const x = (v) => 52 + (v - xmin) / (xmax - xmin) * 560;
    const y = (v) => 365 - (v - ymin) / (ymax - ymin) * 337;
    ctx.strokeStyle = '#d7dfeb'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(52, 25); ctx.lineTo(52, 365); ctx.lineTo(612, 365); ctx.stroke();
    ctx.fillStyle = '#7a8497'; ctx.font = '13px Arial'; ctx.textAlign = 'center';
    ctx.fillText('UMAP 1', 335, 407);
    ctx.save(); ctx.translate(18, 198); ctx.rotate(-Math.PI / 2); ctx.fillText('UMAP 2', 0, 0); ctx.restore();
    for (const point of data.observed) {
      ctx.fillStyle = '#dfe2e9'; ctx.beginPath(); ctx.arc(x(point[0]), y(point[1]), 1.9, 0, Math.PI * 2); ctx.fill();
    }
    const frame = data.frames[frameIndex];
    ctx.globalAlpha = .8;
    for (const point of frame.points) {
      ctx.fillStyle = palette[frameIndex]; ctx.beginPath(); ctx.arc(x(point[0]), y(point[1]), 2.65, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    $('#frame-day').textContent = `Day ${frame.time.toFixed(1)}`;
    $('#frame-day').style.color = palette[frameIndex];
    const observed = data.measurementTimes.includes(frame.time);
    $('#frame-note').textContent = `${frame.points.length} simulated particles · ${observed ? 'measured stage' : 'unmeasured intermediate stage'}`;
    canvas.setAttribute('aria-label', `${frame.points.length} reconstructed particles at day ${frame.time.toFixed(1)} on the fixed UMAP reference, against ${data.observed.length} observed cells. ${observed ? 'Measurements exist at this stage.' : 'This intermediate stage was not sampled.'}`);
    $('.plot-key .purple').style.background = palette[frameIndex];
  }
  const svg = $('#score-plot');
  const ns = 'http://www.w3.org/2000/svg';
  function svgElement(tag, attributes, text) {
    const element = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text !== undefined) element.textContent = text;
    return element;
  }
  const sx = (v) => 55 + v / 5 * 555;
  const sy = (v) => 365 - v / 9 * 328;
  const path = data.curve.map((row, i) => `${i ? 'L' : 'M'}${sx(row[0]).toFixed(3)},${sy(row[1]).toFixed(3)}`).join(' ');
  svg.append(svgElement('rect', {x: sx(1.95), y: 37, width: sx(2.4) - sx(1.95), height: 328, fill: '#f2eaf7'}));
  for (let value = 0; value <= 8; value += 2) {
    svg.append(svgElement('line', {x1: 55, x2: 610, y1: sy(value), y2: sy(value), stroke: '#e8ecf3'}));
    svg.append(svgElement('text', {x: 42, y: sy(value) + 4, fill: '#778196', 'text-anchor': 'end', 'font-size': 12}, value));
  }
  for (let day = 0; day <= 5; day++) svg.append(svgElement('text', {x: sx(day), y: 386, fill: '#778196', 'text-anchor': 'middle', 'font-size': 12}, day));
  svg.append(svgElement('text', {x: 330, y: 412, fill: '#778196', 'text-anchor': 'middle', 'font-size': 13}, 'Time (day)'));
  svg.append(svgElement('text', {transform: 'translate(15,200) rotate(-90)', fill: '#778196', 'text-anchor': 'middle', 'font-size': 13}, 'Transition score'));
  svg.append(svgElement('path', {d: path, fill: 'none', stroke: '#8850a4', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
  const peakRow = data.curve.reduce((a, b) => a[1] > b[1] ? a : b);
  svg.append(svgElement('circle', {cx: sx(peakRow[0]), cy: sy(peakRow[1]), r: 4.5, fill: '#8850a4'}));
  svg.append(svgElement('text', {x: sx(peakRow[0]) + 15, y: sy(peakRow[1]) - 12, fill: '#83559c', 'font-size': 13, 'font-weight': 600}, 'Day 2.325'));
  const cursor = svgElement('line', {x1: 55, x2: 55, y1: 37, y2: 365, stroke: '#7b8ba5', 'stroke-width': 1.2, 'stroke-dasharray': '4 5'});
  const cursorDot = svgElement('circle', {cx: 55, cy: sy(1), r: 5, fill: '#fff', stroke: '#8750a3', 'stroke-width': 2.5});
  svg.append(cursor, cursorDot);
  function updateScore(index) {
    scoreIndex = index;
    const row = data.curve[index];
    cursor.setAttribute('x1', sx(row[0])); cursor.setAttribute('x2', sx(row[0]));
    cursorDot.setAttribute('cx', sx(row[0])); cursorDot.setAttribute('cy', sy(row[1]));
    $('#score-value').textContent = `C(t) = ${row[1].toFixed(2)}`;
    if ($('#score-time')) $('#score-time').textContent = `Day ${row[0].toFixed(3)}`;
    if ($('#score-slider')) $('#score-slider').value = index;
    $('#score-slider')?.setAttribute('aria-valuetext', `Day ${row[0].toFixed(3)}, transition score ${row[1].toFixed(3)}`);
  }
  function updateFrame(index) {
    frameIndex = index;
    const time = data.frames[index].time;
    $('#time-slider').value = index;
    $('#time-output').textContent = `Day ${time.toFixed(1)}`;
    $('#time-slider').setAttribute('aria-valuetext', `Day ${time.toFixed(1)}`);
    drawPopulation();
    updateScore(data.curve.reduce((best, row, i) => Math.abs(row[0] - time) < Math.abs(data.curve[best][0] - time) ? i : best, 0));
  }
  function stop() {
    window.clearInterval(timer); timer = null;
    $('#play').textContent = '▶ Play'; $('#play').setAttribute('aria-label', 'Play population reconstruction');
  }
  $('#time-slider').max = data.frames.length - 1;
  $('#time-slider').addEventListener('input', (event) => { stop(); updateFrame(Number(event.target.value)); });
  $('#score-slider')?.addEventListener('input', (event) => { stop(); updateScore(Number(event.target.value)); });
  $('#peak').addEventListener('click', () => {
    stop(); updateScore(data.curve.findIndex((row) => row[0] === data.peakTime));
  });
  $('#play').addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (frameIndex === data.frames.length - 1) updateFrame(0);
    $('#play').textContent = 'Ⅱ Pause'; $('#play').setAttribute('aria-label', 'Pause population reconstruction');
    timer = window.setInterval(() => {
      if (frameIndex === data.frames.length - 1) { stop(); return; }
      updateFrame(frameIndex + 1);
    }, motionPreference.matches ? 1600 : 850);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  new IntersectionObserver((entries) => { if (!entries[0].isIntersecting) stop(); }, {threshold: .1}).observe($('.explorer'));
  updateFrame(0);
})();
