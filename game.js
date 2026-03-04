// game.js — 小火车铺铁路 核心逻辑 (视觉增强版)
(function () {
  'use strict';

  // ====== 常量 ======
  const TRACK_CONNECTIONS = {
    'straight-h': ['left', 'right'],
    'straight-v': ['up', 'down'],
    'turn-rd':    ['right', 'down'],
    'turn-ld':    ['left', 'down'],
    'turn-ru':    ['right', 'up'],
    'turn-lu':    ['left', 'up'],
    'cross':      ['left', 'right', 'up', 'down'],
  };

  const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };
  const DIR_DELTA = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] };

  const COLORS = {
    grass1: '#A8D5A2', grass2: '#9ECB96',
    rail: '#7A6548', sleeper: '#A0522D',
    gravel: '#C4A87C',
  };

  // ====== 游戏状态 ======
  let canvas, ctx;
  let currentLevel = 0;
  let level, rows, cols, cellSize;
  let placed = [];
  let pieces = {};
  let selectedTool = null;
  let eraserMode = false;
  let hoverCell = null;
  let animating = false;
  let trainPos = null;
  let maxFuel = 0;
  let fuelDisplay = 0;
  let failInfo = null;       // { row, col, reason } 路径断开位置

  // ====== 动画状态 ======
  let lastFrameTime = 0;
  let gameTime = 0;
  let particles = [];
  let placeAnims = [];      // { row, col, startTime }
  let trainAnim = null;     // { path, stepIdx, stepStart }

  // ====== 伪随机 (用于草地装饰) ======
  function pseudoRandom(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  // ====== 初始化 ======
  function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', () => { hoverCell = null; });
    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('resize', onResize);
    document.getElementById('levelLabel').addEventListener('click', () => game.openLevelSelect());
    loadLevel(0);
    requestAnimationFrame(gameLoop);
  }

  // ====== 游戏主循环 ======
  function gameLoop(ts) {
    requestAnimationFrame(gameLoop);
    const dt = ts - lastFrameTime;
    lastFrameTime = ts;
    if (dt > 200) { gameTime = ts; draw(ts); return; } // 跳过后台恢复的大间隔
    gameTime = ts;

    updateTrainAnimation(ts);
    updatePlaceAnims(ts);
    updateParticles(dt / 1000);
    draw(ts);
  }

  // ====== 关卡加载 ======
  function loadLevel(idx) {
    if (idx < 0 || idx >= LEVELS.length) return;
    currentLevel = idx;
    level = LEVELS[idx];
    rows = level.rows;
    cols = level.cols;
    placed = Array.from({ length: rows }, () => Array(cols).fill(null));
    pieces = {};
    for (const [k, v] of Object.entries(level.pieces)) pieces[k] = v;
    selectedTool = null;
    eraserMode = false;
    animating = false;
    trainPos = null;
    trainAnim = null;
    hoverCell = null;
    maxFuel = level.fuel || 0;
    fuelDisplay = maxFuel;
    particles = [];
    placeAnims = [];
    document.getElementById('btnEraser').classList.remove('eraser-active');
    updateTopBar();
    buildToolbar();
    onResize();
  }

  function onResize() {
    const wrap = document.getElementById('canvasWrap');
    const maxW = Math.min(wrap.clientWidth - 16, 500);
    cellSize = Math.floor(maxW / cols);
    const fuelBarH = maxFuel > 0 ? 30 : 0;
    canvas.width = cellSize * cols;
    canvas.height = cellSize * rows + fuelBarH;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
  }

  // ====== 顶部栏 ======
  function updateTopBar() {
    const chIdx = Math.floor(currentLevel / 5);
    const lvIdx = currentLevel % 5 + 1;
    const ch = CHAPTERS[chIdx];
    document.getElementById('levelLabel').textContent = ch.name.split(' ')[0] + ' ' + (chIdx + 1) + '-' + lvIdx;
    document.getElementById('starsDisplay').textContent = '☆☆☆';
  }

  // ====== 工具栏 ======
  function buildToolbar() {
    const bar = document.getElementById('toolbar');
    bar.innerHTML = '';
    for (const type of Object.keys(level.pieces)) {
      const item = document.createElement('div');
      item.className = 'tool-item';
      item.dataset.type = type;
      const mc = document.createElement('canvas');
      mc.width = 40; mc.height = 40;
      drawTrackPreview(mc, type);
      item.appendChild(mc);
      const badge = document.createElement('div');
      badge.className = 'tool-badge';
      badge.textContent = pieces[type];
      item.appendChild(badge);
      item.addEventListener('click', () => selectTool(type));
      bar.appendChild(item);
    }
    refreshToolbar();
  }

  function refreshToolbar() {
    document.querySelectorAll('.tool-item').forEach(item => {
      const type = item.dataset.type;
      item.querySelector('.tool-badge').textContent = pieces[type];
      item.classList.toggle('empty', pieces[type] <= 0);
      item.classList.toggle('selected', selectedTool === type && !eraserMode);
    });
  }

  function selectTool(type) {
    if (pieces[type] <= 0) return;
    eraserMode = false;
    document.getElementById('btnEraser').classList.remove('eraser-active');
    selectedTool = (selectedTool === type) ? null : type;
    refreshToolbar();
  }

  function drawTrackPreview(mc, type) {
    const c = mc.getContext('2d');
    const s = 40;
    c.clearRect(0, 0, s, s);

    // 先画碎石底座
    c.fillStyle = '#D4B896';
    const gap = s * 0.12;
    const pad = s * 0.2;
    if (type === 'straight-h') {
      c.beginPath(); c.roundRect(0, s/2 - pad, s, pad * 2, 3); c.fill();
    } else if (type === 'straight-v') {
      c.beginPath(); c.roundRect(s/2 - pad, 0, pad * 2, s, 3); c.fill();
    } else if (type === 'cross') {
      c.beginPath(); c.roundRect(0, s/2 - pad, s, pad * 2, 3); c.fill();
      c.beginPath(); c.roundRect(s/2 - pad, 0, pad * 2, s, 3); c.fill();
    } else {
      const td = getTurnData(type, 0, 0, s);
      c.beginPath();
      c.arc(td.cx, td.cy, s/2 + pad, td.startAngle, td.endAngle);
      c.arc(td.cx, td.cy, s/2 - pad, td.endAngle, td.startAngle, true);
      c.closePath(); c.fill();
    }

    c.strokeStyle = COLORS.rail;
    c.lineWidth = 2;
    c.lineCap = 'round';

    if (type === 'straight-h') {
      c.beginPath(); c.moveTo(0, s/2 - gap); c.lineTo(s, s/2 - gap); c.stroke();
      c.beginPath(); c.moveTo(0, s/2 + gap); c.lineTo(s, s/2 + gap); c.stroke();
      c.strokeStyle = COLORS.sleeper; c.lineWidth = 2;
      for (let i = 1; i <= 4; i++) { const x = (i/5)*s; c.beginPath(); c.moveTo(x, s/2-gap-3); c.lineTo(x, s/2+gap+3); c.stroke(); }
    } else if (type === 'straight-v') {
      c.beginPath(); c.moveTo(s/2 - gap, 0); c.lineTo(s/2 - gap, s); c.stroke();
      c.beginPath(); c.moveTo(s/2 + gap, 0); c.lineTo(s/2 + gap, s); c.stroke();
      c.strokeStyle = COLORS.sleeper; c.lineWidth = 2;
      for (let i = 1; i <= 4; i++) { const y = (i/5)*s; c.beginPath(); c.moveTo(s/2-gap-3, y); c.lineTo(s/2+gap+3, y); c.stroke(); }
    } else if (type === 'cross') {
      c.beginPath(); c.moveTo(0, s/2-gap); c.lineTo(s, s/2-gap); c.stroke();
      c.beginPath(); c.moveTo(0, s/2+gap); c.lineTo(s, s/2+gap); c.stroke();
      c.beginPath(); c.moveTo(s/2-gap, 0); c.lineTo(s/2-gap, s); c.stroke();
      c.beginPath(); c.moveTo(s/2+gap, 0); c.lineTo(s/2+gap, s); c.stroke();
      c.fillStyle = COLORS.sleeper; c.beginPath(); c.arc(s/2, s/2, 3, 0, Math.PI*2); c.fill();
    } else {
      const td = getTurnData(type, 0, 0, s);
      c.beginPath(); c.arc(td.cx, td.cy, s/2-gap, td.startAngle, td.endAngle); c.stroke();
      c.beginPath(); c.arc(td.cx, td.cy, s/2+gap, td.startAngle, td.endAngle); c.stroke();
    }
  }

  // ====== Canvas 交互 ======
  function getCellFromPos(x, y) {
    const fuelBarH = maxFuel > 0 ? 30 : 0;
    const gy = y - fuelBarH;
    if (gy < 0) return null;
    const r = Math.floor(gy / cellSize);
    const c = Math.floor(x / cellSize);
    if (r < 0 || r >= rows || c < 0 || c >= cols) return null;
    return { row: r, col: c };
  }

  function onMouseMove(e) {
    if (animating) return;
    const rect = canvas.getBoundingClientRect();
    hoverCell = getCellFromPos(e.clientX - rect.left, e.clientY - rect.top);
  }

  function onCanvasClick(e) {
    if (animating) return;
    const rect = canvas.getBoundingClientRect();
    const cell = getCellFromPos(e.clientX - rect.left, e.clientY - rect.top);
    if (cell) handleCellAction(cell.row, cell.col);
  }

  function onTouchStart(e) {
    if (animating) return;
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const cell = getCellFromPos(t.clientX - rect.left, t.clientY - rect.top);
    if (cell) handleCellAction(cell.row, cell.col);
  }

  function handleCellAction(r, c) {
    const cellVal = level.grid[r][c];
    if (cellVal === 1 || cellVal === 'S' || cellVal === 'E') return;
    if (cellVal !== 0 && cellVal !== 'G') return;

    failInfo = null; // 放置/擦除时清除失败标记

    if (eraserMode) {
      if (placed[r][c]) {
        pieces[placed[r][c].type]++;
        placed[r][c] = null;
        spawnParticles(c * cellSize + cellSize / 2, r * cellSize + cellSize / 2, 'erase');
        refreshToolbar();
      }
      return;
    }

    if (!selectedTool) return;

    if (placed[r][c]) pieces[placed[r][c].type]++;
    if (pieces[selectedTool] <= 0) {
      if (placed[r][c]) pieces[placed[r][c].type]--;
      return;
    }

    placed[r][c] = { type: selectedTool };
    pieces[selectedTool]--;
    placeAnims.push({ row: r, col: c, startTime: gameTime });
    spawnParticles(c * cellSize + cellSize / 2, r * cellSize + cellSize / 2, 'place');
    refreshToolbar();
  }

  // ====== 粒子系统 ======
  function spawnParticles(x, y, type) {
    const fuelBarH = maxFuel > 0 ? 30 : 0;
    y += fuelBarH;

    if (type === 'place') {
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5) * 0.5;
        const speed = 50 + Math.random() * 70;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1, decay: 2.2 + Math.random() * 0.8,
          size: 2.5 + Math.random() * 3,
          color: ['#FFD700', '#FF8C00', '#4CAF50', '#2196F3', '#FF6B6B'][Math.floor(Math.random() * 5)],
          shape: 'circle',
        });
      }
    } else if (type === 'erase') {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.4;
        const speed = 30 + Math.random() * 40;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1, decay: 3 + Math.random(),
          size: 2 + Math.random() * 2,
          color: '#e74c3c',
          shape: 'circle',
        });
      }
    } else if (type === 'confetti') {
      for (let i = 0; i < 55; i++) {
        const cx = canvas.width * (0.2 + Math.random() * 0.6);
        particles.push({
          x: cx, y: canvas.height + 5,
          vx: (Math.random() - 0.5) * 160,
          vy: -(250 + Math.random() * 350),
          gravity: 220,
          life: 1, decay: 0.28 + Math.random() * 0.25,
          size: 4 + Math.random() * 7,
          color: ['#e74c3c','#f1c40f','#2ecc71','#3498db','#9b59b6','#FF8C00','#E91E63'][Math.floor(Math.random() * 7)],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 12,
          shape: Math.random() > 0.4 ? 'rect' : 'circle',
        });
      }
    } else if (type === 'smoke') {
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 4,
          y: y,
          vx: (Math.random() - 0.5) * 15,
          vy: -20 - Math.random() * 30,
          life: 1, decay: 1.5 + Math.random(),
          size: 3 + Math.random() * 4,
          color: 'smoke',
          shape: 'circle',
        });
      }
    }
  }

  function updateParticles(dtSec) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      if (p.gravity) p.vy += p.gravity * dtSec;
      if (p.rotSpeed) p.rotation += p.rotSpeed * dtSec;
      p.life -= p.decay * dtSec;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.save();
      const alpha = Math.max(0, Math.min(1, p.life));
      ctx.globalAlpha = alpha;
      if (p.color === 'smoke') {
        ctx.fillStyle = `rgba(190,190,190,${alpha * 0.5})`;
      } else {
        ctx.fillStyle = p.color;
      }
      ctx.translate(p.x, p.y);
      if (p.rotation) ctx.rotate(p.rotation);
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ====== 放置动画 ======
  function updatePlaceAnims(ts) {
    placeAnims = placeAnims.filter(a => ts - a.startTime < 400);
  }

  function getPlaceScale(row, col, ts) {
    const anim = placeAnims.find(a => a.row === row && a.col === col);
    if (!anim) return 1;
    let t = (ts - anim.startTime) / 400;
    if (t >= 1) return 1;
    // elastic overshoot: 0 → 1.18 → 0.95 → 1.0
    if (t < 0.4) return 0.3 + t * 2.2;
    if (t < 0.7) return 1.18 - (t - 0.4) * 0.77;
    return 0.95 + (t - 0.7) * 0.167;
  }

  // ====== 主绘制 ======
  function draw(ts) {
    const fuelBarH = maxFuel > 0 ? 30 : 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 燃料条区域
    if (fuelBarH > 0) {
      ctx.fillStyle = 'rgba(74,144,217,0.15)';
      ctx.fillRect(0, 0, canvas.width, fuelBarH);
      drawFuelBar();
    }

    ctx.save();
    ctx.translate(0, fuelBarH);

    // 草地棋盘格
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? COLORS.grass1 : COLORS.grass2;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }

    // 草地装饰 (花朵、草丛)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = level.grid[r][c];
        if (v === 0 && !placed[r][c]) {
          drawGrassDetails(c * cellSize, r * cellSize, r, c);
        }
      }
    }

    // 网格线
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    for (let r = 1; r < rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * cellSize); ctx.lineTo(cols * cellSize, r * cellSize); ctx.stroke();
    }
    for (let c = 1; c < cols; c++) {
      ctx.beginPath(); ctx.moveTo(c * cellSize, 0); ctx.lineTo(c * cellSize, rows * cellSize); ctx.stroke();
    }
    ctx.setLineDash([]);

    // 障碍物、起点、终点、加油站
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = level.grid[r][c];
        const x = c * cellSize, y = r * cellSize;
        if (v === 1)   drawTree(x, y);
        if (v === 'S') drawStart(x, y, ts);
        if (v === 'E') drawEnd(x, y, ts);
        if (v === 'G') drawGasStation(x, y, ts);
      }
    }

    // 已放置轨道 (含放置动画)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!placed[r][c]) continue;
        const scale = getPlaceScale(r, c, ts);
        const cx = c * cellSize + cellSize / 2;
        const cy = r * cellSize + cellSize / 2;
        if (scale !== 1) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(scale, scale);
          ctx.translate(-cx, -cy);
        }
        drawGravelBed(c * cellSize, r * cellSize, cellSize, placed[r][c].type);
        drawTrack(c * cellSize, r * cellSize, cellSize, placed[r][c].type);
        if (scale !== 1) ctx.restore();
      }
    }

    // Hover 效果
    if (hoverCell && !animating) {
      const { row, col } = hoverCell;
      const v = level.grid[row][col];
      if (v === 0 || v === 'G') {
        if (eraserMode && placed[row][col]) {
          // 橡皮擦红色覆盖 + X
          ctx.fillStyle = 'rgba(231, 76, 60, 0.25)';
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
          ctx.strokeStyle = 'rgba(231, 76, 60, 0.6)';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          const m = cellSize * 0.28;
          const x = col * cellSize, y = row * cellSize;
          ctx.beginPath(); ctx.moveTo(x + m, y + m); ctx.lineTo(x + cellSize - m, y + cellSize - m); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + cellSize - m, y + m); ctx.lineTo(x + m, y + cellSize - m); ctx.stroke();
        } else if (!eraserMode && selectedTool) {
          // 半透明轨道预览
          ctx.save();
          ctx.globalAlpha = 0.32;
          drawGravelBed(col * cellSize, row * cellSize, cellSize, selectedTool);
          drawTrack(col * cellSize, row * cellSize, cellSize, selectedTool);
          ctx.restore();
          // 橙色边框
          ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
          ctx.lineWidth = 2;
          ctx.strokeRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }

    // 失败位置高亮闪烁
    if (failInfo && !animating) {
      const fi = failInfo;
      const fx = fi.col * cellSize, fy = fi.row * cellSize;
      const pulse = 0.35 + Math.sin(ts / 250) * 0.25;
      ctx.fillStyle = `rgba(244, 67, 54, ${pulse})`;
      ctx.beginPath();
      ctx.roundRect(fx + 2, fy + 2, cellSize - 4, cellSize - 4, 4);
      ctx.fill();
      ctx.strokeStyle = `rgba(244, 67, 54, ${pulse + 0.2})`;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(fx + 1, fy + 1, cellSize - 2, cellSize - 2);
      // ✕ 标记
      ctx.font = `bold ${cellSize * 0.35}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(255, 255, 255, ${pulse + 0.3})`;
      ctx.fillText('✕', fx + cellSize / 2, fy + cellSize / 2);
    }

    // 火车
    if (trainPos) {
      drawTrain(trainPos.x, trainPos.y, trainPos.dir, ts);
    }

    ctx.restore();

    // 粒子 (在全局坐标绘制)
    drawParticles();
  }

  // ====== 草地装饰 ======
  function drawGrassDetails(x, y, row, col) {
    const seed = row * 137 + col * 311;
    const r0 = pseudoRandom(seed);
    if (r0 > 0.55) return; // 部分格子没有装饰

    const s = cellSize;

    if (r0 < 0.25) {
      // 小花
      const fx = x + pseudoRandom(seed + 1) * s * 0.5 + s * 0.25;
      const fy = y + pseudoRandom(seed + 2) * s * 0.5 + s * 0.25;
      const flowerColors = ['#FF69B4', '#FFD700', '#FF6347', '#DDA0DD', '#87CEEB'];
      const fc = flowerColors[Math.floor(pseudoRandom(seed + 3) * flowerColors.length)];
      const fs = s * 0.04;
      ctx.fillStyle = fc;
      for (let p = 0; p < 5; p++) {
        const a = (Math.PI * 2 * p) / 5;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(a) * fs * 1.2, fy + Math.sin(a) * fs * 1.2, fs, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FFF176';
      ctx.beginPath();
      ctx.arc(fx, fy, fs * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 草丛
      const gx = x + pseudoRandom(seed + 4) * s * 0.5 + s * 0.25;
      const gy = y + pseudoRandom(seed + 5) * s * 0.5 + s * 0.35;
      ctx.strokeStyle = '#7CB342';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      for (let b = -1; b <= 1; b++) {
        const bx = gx + b * s * 0.035;
        ctx.beginPath();
        ctx.moveTo(bx, gy);
        ctx.quadraticCurveTo(bx + b * s * 0.05, gy - s * 0.09, bx + b * s * 0.03, gy - s * 0.14);
        ctx.stroke();
      }
    }
  }

  // ====== 树 (多层松树 + 阴影) ======
  function drawTree(x, y) {
    const s = cellSize;
    const cx = x + s / 2;

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(cx + s * 0.04, y + s * 0.84, s * 0.2, s * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();

    // 树干
    ctx.fillStyle = '#6B4226';
    ctx.beginPath();
    ctx.roundRect(cx - s * 0.05, y + s * 0.56, s * 0.1, s * 0.26, 2);
    ctx.fill();

    // 三层树冠
    const layers = [
      { top: 0.30, bot: 0.62, w: 0.32, color: '#6B9B5A' },
      { top: 0.18, bot: 0.50, w: 0.26, color: '#5D8A4E' },
      { top: 0.08, bot: 0.38, w: 0.20, color: '#4A7A3B' },
    ];
    for (const l of layers) {
      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.moveTo(cx, y + s * l.top);
      ctx.lineTo(cx - s * l.w, y + s * l.bot);
      ctx.lineTo(cx + s * l.w, y + s * l.bot);
      ctx.closePath();
      ctx.fill();
    }

    // 树顶高光
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(cx, y + s * 0.08);
    ctx.lineTo(cx - s * 0.06, y + s * 0.20);
    ctx.lineTo(cx + s * 0.03, y + s * 0.18);
    ctx.closePath();
    ctx.fill();
  }

  // ====== 起点 (脉冲光晕 + 方向箭头) ======
  function drawStart(x, y, ts) {
    const s = cellSize;
    const pulse = 0.18 + Math.sin(ts / 600) * 0.08;
    ctx.fillStyle = `rgba(76, 175, 80, ${pulse})`;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, s - 4, s - 4, 4);
    ctx.fill();
    // 光晕
    const glowR = s * 0.35 + Math.sin(ts / 600) * s * 0.05;
    const grad = ctx.createRadialGradient(x + s/2, y + s/2, 0, x + s/2, y + s/2, glowR);
    grad.addColorStop(0, 'rgba(76,175,80,0.2)');
    grad.addColorStop(1, 'rgba(76,175,80,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, s, s);
    // emoji
    ctx.font = `${s * 0.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚉', x + s / 2, y + s / 2);
    // 起始方向箭头
    drawStartDirArrow(x, y, s, ts);
  }

  // 绘制起点方向箭头（动态呼吸 + 来回位移）
  function drawStartDirArrow(x, y, s, ts) {
    const dir = level.startDir;
    const cx = x + s / 2, cy = y + s / 2;
    // 箭头方向角度: right=0, down=90, left=180, up=270
    const angles = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
    const angle = angles[dir];
    // 箭头沿出发方向偏移到格子边缘外
    const [dr, dc] = DIR_DELTA[dir];
    const baseOff = s * 0.45;
    const bounce = Math.sin(ts / 400) * s * 0.06;
    const ox = cx + dc * (baseOff + bounce);
    const oy = cy + dr * (baseOff + bounce);
    // 箭头大小
    const aLen = s * 0.18;
    const aW = s * 0.13;
    const alpha = 0.7 + Math.sin(ts / 400) * 0.3;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(aLen, 0);
    ctx.lineTo(-aLen * 0.3, -aW);
    ctx.lineTo(-aLen * 0.3, aW);
    ctx.closePath();
    ctx.fillStyle = `rgba(56, 142, 60, ${alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // ====== 终点 (脉冲光晕) ======
  function drawEnd(x, y, ts) {
    const s = cellSize;
    const pulse = 0.18 + Math.sin(ts / 500 + 1) * 0.08;
    ctx.fillStyle = `rgba(255, 152, 0, ${pulse})`;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, s - 4, s - 4, 4);
    ctx.fill();
    const glowR = s * 0.35 + Math.sin(ts / 500 + 1) * s * 0.05;
    const grad = ctx.createRadialGradient(x + s/2, y + s/2, 0, x + s/2, y + s/2, glowR);
    grad.addColorStop(0, 'rgba(255,152,0,0.2)');
    grad.addColorStop(1, 'rgba(255,152,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, s, s);
    ctx.font = `${s * 0.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏘️', x + s / 2, y + s / 2);
  }

  // ====== 加油站 (脉冲) ======
  function drawGasStation(x, y, ts) {
    const s = cellSize;
    const pulse = 0.22 + Math.sin(ts / 700) * 0.06;
    ctx.fillStyle = `rgba(255, 235, 59, ${pulse})`;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, s - 4, s - 4, 4);
    ctx.fill();
    ctx.font = `${s * 0.42}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⛽', x + s / 2, y + s / 2);
  }

  // ====== 燃料条 ======
  function drawFuelBar() {
    const barW = canvas.width * 0.58;
    const barX = (canvas.width - barW) / 2;
    const barY = 8;
    const h = 14;
    const ratio = maxFuel > 0 ? Math.max(0, fuelDisplay / maxFuel) : 0;

    ctx.font = '14px serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('⛽', barX - 5, barY + h / 2);

    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, h, 7); ctx.fill();

    // 填充
    const color = ratio > 0.5 ? '#4CAF50' : ratio > 0.25 ? '#FF9800' : '#F44336';
    const fillW = barW * ratio;
    if (fillW > 0) {
      const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
      grad.addColorStop(0, color);
      grad.addColorStop(1, ratio > 0.5 ? '#66BB6A' : ratio > 0.25 ? '#FFB74D' : '#EF5350');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(barX, barY, fillW, h, 7); ctx.fill();
      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.roundRect(barX + 2, barY + 1, fillW - 4, h * 0.4, 4); ctx.fill();
    }

    // 边框
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, h, 7); ctx.stroke();

    // 文字
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 2;
    ctx.fillText(Math.round(fuelDisplay) + '/' + maxFuel, barX + barW / 2, barY + h / 2);
    ctx.shadowBlur = 0;
  }

  // ====== 碎石路基 ======
  function drawGravelBed(x, y, s, type) {
    ctx.fillStyle = COLORS.gravel;
    const pad = s * 0.20;
    if (type === 'straight-h') {
      ctx.beginPath(); ctx.roundRect(x, y + s/2 - pad, s, pad * 2, 3); ctx.fill();
    } else if (type === 'straight-v') {
      ctx.beginPath(); ctx.roundRect(x + s/2 - pad, y, pad * 2, s, 3); ctx.fill();
    } else if (type === 'cross') {
      ctx.beginPath(); ctx.roundRect(x, y + s/2 - pad, s, pad * 2, 3); ctx.fill();
      ctx.beginPath(); ctx.roundRect(x + s/2 - pad, y, pad * 2, s, 3); ctx.fill();
    } else {
      const td = getTurnData(type, x, y, s);
      ctx.beginPath();
      ctx.arc(td.cx, td.cy, s/2 + pad, td.startAngle, td.endAngle);
      ctx.arc(td.cx, td.cy, s/2 - pad, td.endAngle, td.startAngle, true);
      ctx.closePath();
      ctx.fill();
    }
    // 碎石纹理点
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    const seed = Math.floor(x * 7 + y * 13);
    for (let i = 0; i < 5; i++) {
      const gx = x + pseudoRandom(seed + i * 3) * s;
      const gy = y + pseudoRandom(seed + i * 3 + 1) * s;
      // 简单检查点是否在路基范围内
      const dx = gx - (x + s/2), dy = gy - (y + s/2);
      if (Math.abs(dx) < pad + s*0.2 || Math.abs(dy) < pad + s*0.2) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1 + pseudoRandom(seed + i * 3 + 2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ====== 轨道绘制 ======
  function getTurnData(type, x, y, s) {
    return {
      'turn-rd': { cx: x + s, cy: y + s, startAngle: Math.PI,       endAngle: 1.5 * Math.PI },
      'turn-ld': { cx: x,     cy: y + s, startAngle: 1.5 * Math.PI, endAngle: 2 * Math.PI },
      'turn-ru': { cx: x + s, cy: y,     startAngle: 0.5 * Math.PI, endAngle: Math.PI },
      'turn-lu': { cx: x,     cy: y,     startAngle: 0,              endAngle: 0.5 * Math.PI },
    }[type];
  }

  function drawTrack(x, y, s, type) {
    const gap = s * 0.12;
    const railW = Math.max(2, s * 0.035);
    const sleeperW = Math.max(2, s * 0.045);

    if (type === 'straight-h') {
      // 枕木先画(在轨道下方)
      ctx.strokeStyle = COLORS.sleeper;
      ctx.lineWidth = sleeperW;
      ctx.lineCap = 'butt';
      for (let i = 1; i <= 4; i++) {
        const px = x + (i / 5) * s;
        ctx.beginPath(); ctx.moveTo(px, y + s/2 - gap - s*0.07); ctx.lineTo(px, y + s/2 + gap + s*0.07); ctx.stroke();
      }
      // 铁轨
      ctx.strokeStyle = COLORS.rail;
      ctx.lineWidth = railW;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y + s/2 - gap); ctx.lineTo(x + s, y + s/2 - gap); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + s/2 + gap); ctx.lineTo(x + s, y + s/2 + gap); ctx.stroke();
      // 铁轨高光
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y + s/2 - gap - 1); ctx.lineTo(x + s, y + s/2 - gap - 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + s/2 + gap - 1); ctx.lineTo(x + s, y + s/2 + gap - 1); ctx.stroke();
    } else if (type === 'straight-v') {
      ctx.strokeStyle = COLORS.sleeper;
      ctx.lineWidth = sleeperW;
      ctx.lineCap = 'butt';
      for (let i = 1; i <= 4; i++) {
        const py = y + (i / 5) * s;
        ctx.beginPath(); ctx.moveTo(x + s/2 - gap - s*0.07, py); ctx.lineTo(x + s/2 + gap + s*0.07, py); ctx.stroke();
      }
      ctx.strokeStyle = COLORS.rail;
      ctx.lineWidth = railW;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + s/2 - gap, y); ctx.lineTo(x + s/2 - gap, y + s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s/2 + gap, y); ctx.lineTo(x + s/2 + gap, y + s); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + s/2 - gap - 1, y); ctx.lineTo(x + s/2 - gap - 1, y + s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s/2 + gap - 1, y); ctx.lineTo(x + s/2 + gap - 1, y + s); ctx.stroke();
    } else if (type === 'cross') {
      // 枕木
      ctx.strokeStyle = COLORS.sleeper;
      ctx.lineWidth = sleeperW;
      ctx.lineCap = 'butt';
      for (let i = 1; i <= 4; i++) {
        const px = x + (i / 5) * s;
        if (Math.abs(px - (x + s/2)) > gap + 3) {
          ctx.beginPath(); ctx.moveTo(px, y + s/2 - gap - s*0.07); ctx.lineTo(px, y + s/2 + gap + s*0.07); ctx.stroke();
        }
        const py = y + (i / 5) * s;
        if (Math.abs(py - (y + s/2)) > gap + 3) {
          ctx.beginPath(); ctx.moveTo(x + s/2 - gap - s*0.07, py); ctx.lineTo(x + s/2 + gap + s*0.07, py); ctx.stroke();
        }
      }
      // 铁轨
      ctx.strokeStyle = COLORS.rail;
      ctx.lineWidth = railW;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y + s/2 - gap); ctx.lineTo(x + s, y + s/2 - gap); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + s/2 + gap); ctx.lineTo(x + s, y + s/2 + gap); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s/2 - gap, y); ctx.lineTo(x + s/2 - gap, y + s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s/2 + gap, y); ctx.lineTo(x + s/2 + gap, y + s); ctx.stroke();
      // 中心铆钉
      ctx.fillStyle = COLORS.sleeper;
      ctx.beginPath(); ctx.arc(x + s/2, y + s/2, s * 0.045, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.arc(x + s/2 - 1, y + s/2 - 1, s * 0.02, 0, Math.PI * 2); ctx.fill();
    } else {
      // 弯道
      const td = getTurnData(type, x, y, s);
      const r1 = s / 2 - gap;
      const r2 = s / 2 + gap;
      // 枕木
      ctx.strokeStyle = COLORS.sleeper;
      ctx.lineWidth = sleeperW;
      ctx.lineCap = 'butt';
      const arcSpan = td.endAngle - td.startAngle;
      for (let i = 1; i <= 3; i++) {
        const angle = td.startAngle + (i / 4) * arcSpan;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(td.cx + (r1 - s*0.07) * cos, td.cy + (r1 - s*0.07) * sin);
        ctx.lineTo(td.cx + (r2 + s*0.07) * cos, td.cy + (r2 + s*0.07) * sin);
        ctx.stroke();
      }
      // 铁轨
      ctx.strokeStyle = COLORS.rail;
      ctx.lineWidth = railW;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(td.cx, td.cy, r1, td.startAngle, td.endAngle); ctx.stroke();
      ctx.beginPath(); ctx.arc(td.cx, td.cy, r2, td.startAngle, td.endAngle); ctx.stroke();
      // 高光
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(td.cx, td.cy, r1 - 1, td.startAngle, td.endAngle); ctx.stroke();
      ctx.beginPath(); ctx.arc(td.cx, td.cy, r2 - 1, td.startAngle, td.endAngle); ctx.stroke();
    }
  }

  // ====== 火车 (增强版) ======
  function drawTrain(px, py, dir, ts) {
    const s = cellSize;
    const w = s * 0.65;
    const h = s * 0.42;

    ctx.save();
    ctx.translate(px, py);
    const angles = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
    ctx.rotate(angles[dir] || 0);

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(2, h / 2 + 3, w * 0.42, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 车轮
    const wheelR = h * 0.16;
    const wheelY = h / 2 - 1;
    const wheelPositions = [-w * 0.3, -w * 0.05, w * 0.2];
    ctx.fillStyle = '#333';
    for (const wx of wheelPositions) {
      ctx.beginPath(); ctx.arc(wx, wheelY, wheelR, 0, Math.PI * 2); ctx.fill();
    }
    // 车轮轮毂
    ctx.fillStyle = '#666';
    for (const wx of wheelPositions) {
      ctx.beginPath(); ctx.arc(wx, wheelY, wheelR * 0.4, 0, Math.PI * 2); ctx.fill();
    }

    // 车身
    const bodyY = -h * 0.48;
    const bodyH = h * 0.88;
    ctx.fillStyle = '#D32F2F';
    ctx.beginPath();
    ctx.roundRect(-w / 2, bodyY, w, bodyH, h * 0.15);
    ctx.fill();

    // 车身高光条
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 2, bodyY + 2, w - 4, bodyH * 0.35, [h * 0.12, h * 0.12, 0, 0]);
    ctx.fill();

    // 金色腰线
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 4, bodyY + bodyH * 0.62);
    ctx.lineTo(w / 2 - 4, bodyY + bodyH * 0.62);
    ctx.stroke();

    // 车头三角
    ctx.fillStyle = '#B71C1C';
    ctx.beginPath();
    ctx.moveTo(w / 2, bodyY + bodyH * 0.1);
    ctx.lineTo(w / 2 + h * 0.32, bodyY + bodyH * 0.5);
    ctx.lineTo(w / 2, bodyY + bodyH * 0.9);
    ctx.closePath();
    ctx.fill();

    // 车窗
    ctx.fillStyle = '#BBDEFB';
    const winX = w * 0.06, winY = bodyY + bodyH * 0.15;
    const winW = w * 0.2, winH = bodyH * 0.45;
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, 2);
    ctx.fill();
    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 1;
    ctx.stroke();
    // 窗户反光
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.roundRect(winX + 1.5, winY + 1.5, winW * 0.35, winH - 3, 1);
    ctx.fill();

    // 烟囱
    const chimX = -w * 0.22;
    const chimW = w * 0.11;
    const chimH = h * 0.28;
    ctx.fillStyle = '#37474F';
    ctx.beginPath();
    ctx.roundRect(chimX, bodyY - chimH, chimW, chimH, [3, 3, 0, 0]);
    ctx.fill();
    // 烟囱顶
    ctx.fillStyle = '#546E7A';
    ctx.fillRect(chimX - 1.5, bodyY - chimH, chimW + 3, 3);

    // 动态烟雾
    const time = ts || 0;
    for (let i = 0; i < 4; i++) {
      const phase = ((time / 800) + i * 0.25) % 1;
      const alpha = 0.45 * (1 - phase);
      const size = h * (0.1 + phase * 0.18);
      const sx = chimX + chimW / 2 - phase * w * 0.18 + Math.sin(phase * 6 + i) * 3;
      const sy = bodyY - chimH - phase * h * 0.6 - h * 0.08;
      ctx.fillStyle = `rgba(200,200,200,${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 运动时喷烟雾粒子
    if (animating && Math.random() < 0.15) {
      const fuelBarH = maxFuel > 0 ? 30 : 0;
      spawnParticles(px, py + fuelBarH - cellSize * 0.2, 'smoke');
    }
  }

  // ====== 路径构建 ======
  function findCell(val) {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (level.grid[r][c] === val) return { row: r, col: c };
    return null;
  }

  function getPixelPos(row, col) {
    return { x: col * cellSize + cellSize / 2, y: row * cellSize + cellSize / 2 };
  }

  function buildPath() {
    const start = findCell('S');
    const end = findCell('E');
    if (!start || !end) { failInfo = { row: 0, col: 0, reason: 'missing' }; return { path: [], success: false }; }

    const path = [{ row: start.row, col: start.col, dir: level.startDir }];
    let curRow = start.row, curCol = start.col, curDir = level.startDir;
    let fuel = maxFuel;
    const visited = new Set();
    visited.add(`${curRow},${curCol},${curDir}`);

    const DIR_LABEL = { left: '左', right: '右', up: '上', down: '下' };

    for (let step = 0; step < rows * cols * 4 + 10; step++) {
      const [dr, dc] = DIR_DELTA[curDir];
      const nr = curRow + dr, nc = curCol + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
        failInfo = { row: curRow, col: curCol, reason: `火车往${DIR_LABEL[curDir]}驶出了地图边界` };
        return { path, success: false };
      }

      if (level.grid[nr][nc] === 'E') {
        if (maxFuel > 0) fuel--;
        if (fuel < 0) {
          failInfo = { row: nr, col: nc, reason: '燃料不足，到不了终点' };
          path.push({ row: nr, col: nc, dir: curDir, fuel });
          return { path, success: false };
        }
        path.push({ row: nr, col: nc, dir: curDir, fuel });
        failInfo = null;
        return { path, success: true };
      }

      if (level.grid[nr][nc] === 1) {
        failInfo = { row: nr, col: nc, reason: `火车往${DIR_LABEL[curDir]}撞到了障碍物` };
        return { path, success: false };
      }

      const track = placed[nr][nc];
      if (!track) {
        failInfo = { row: nr, col: nc, reason: `这里缺少铁轨` };
        return { path, success: false };
      }
      const enterDir = OPPOSITE[curDir];
      const conns = TRACK_CONNECTIONS[track.type];
      if (!conns.includes(enterDir)) {
        failInfo = { row: nr, col: nc, reason: `火车从${DIR_LABEL[enterDir]}边进入，但此铁轨接不上` };
        return { path, success: false };
      }

      let exitDir = track.type === 'cross' ? curDir : conns.find(d => d !== enterDir);
      if (!exitDir) { failInfo = { row: nr, col: nc, reason: '铁轨没有出口方向' }; return { path, success: false }; }

      if (maxFuel > 0) {
        fuel--;
        if (fuel < 0) {
          failInfo = { row: nr, col: nc, reason: '燃料耗尽！' };
          path.push({ row: nr, col: nc, dir: curDir, fuel });
          return { path, success: false };
        }
        if (level.grid[nr][nc] === 'G') fuel = maxFuel;
      }

      const key = `${nr},${nc},${exitDir}`;
      if (visited.has(key)) { failInfo = { row: nr, col: nc, reason: '铁轨形成了死循环' }; return { path, success: false }; }
      visited.add(key);

      curRow = nr; curCol = nc; curDir = exitDir;
      path.push({ row: nr, col: nc, dir: curDir, fuel });
    }
    failInfo = { row: curRow, col: curCol, reason: '路径太长了' };
    return { path, success: false };
  }

  // ====== 缓动 ======
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // ====== 火车动画 (集成到游戏循环) ======
  function startTrainAnimation(path, isFail) {
    animating = true;
    trainAnim = {
      path,
      stepIdx: 0,
      stepStart: performance.now(),
      stepDuration: 350,
      startFuel: maxFuel,
      winTimer: 0,
      isFail: !!isFail,
      failTimer: 0,
    };
    fuelDisplay = maxFuel;
  }

  function updateTrainAnimation(now) {
    if (!trainAnim) return;
    const { path, stepDuration, startFuel } = trainAnim;

    // 到达终点
    if (trainAnim.stepIdx >= path.length - 1) {
      const last = path[path.length - 1];
      trainPos = { ...getPixelPos(last.row, last.col), dir: last.dir };
      if (maxFuel > 0 && last.fuel !== undefined) fuelDisplay = last.fuel;

      // 失败模式：火车跑到断开处后弹出失败
      if (trainAnim.isFail) {
        if (!trainAnim.failTimer) {
          trainAnim.failTimer = now;
        }
        if (now - trainAnim.failTimer > 400) {
          animating = false;
          trainAnim = null;
          showFail();
        }
        return;
      }

      if (!trainAnim.winTimer) {
        trainAnim.winTimer = now;
        spawnParticles(0, 0, 'confetti');
      }
      if (now - trainAnim.winTimer > 500) {
        animating = false;
        trainPos = null;
        trainAnim = null;
        showWin();
      }
      return;
    }

    const elapsed = now - trainAnim.stepStart;
    let t = Math.min(elapsed / stepDuration, 1);
    const et = easeInOut(t);

    const from = path[trainAnim.stepIdx];
    const to = path[trainAnim.stepIdx + 1];
    const fromPx = getPixelPos(from.row, from.col);
    const toPx = getPixelPos(to.row, to.col);

    trainPos = {
      x: fromPx.x + (toPx.x - fromPx.x) * et,
      y: fromPx.y + (toPx.y - fromPx.y) * et,
      dir: to.dir,
    };

    if (maxFuel > 0) {
      const fromFuel = trainAnim.stepIdx === 0 ? startFuel : (from.fuel !== undefined ? from.fuel : startFuel);
      const toFuel = to.fuel !== undefined ? to.fuel : fromFuel;
      fuelDisplay = t < 0.9 ? fromFuel : toFuel;
    }

    if (t >= 1) {
      trainAnim.stepIdx++;
      trainAnim.stepStart = now;
    }
  }

  // ====== 胜负弹窗 ======
  function countUsedPieces() {
    let count = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (placed[r][c]) count++;
    return count;
  }

  function calcStars() {
    const used = countUsedPieces();
    const [s3, s2] = level.stars;
    if (used <= s3) return 3;
    if (used <= s2) return 2;
    return 1;
  }

  function showWin() {
    const stars = calcStars();
    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('starsDisplay').textContent = starStr;

    const overlay = document.getElementById('modalOverlay');
    document.getElementById('modalIcon').innerHTML = '<span class="chug">🚂💨</span>';
    document.getElementById('modalTitle').textContent = '太棒了！';
    document.getElementById('modalStars').textContent = starStr;

    let btns = '<button class="ctrl-btn orange" onclick="game.resetLevel()">再来一次</button>';
    if (currentLevel < LEVELS.length - 1) {
      btns += '<button class="ctrl-btn green" onclick="game.nextLevel()">下一关 ▶</button>';
    }
    document.getElementById('modalButtons').innerHTML = btns;
    overlay.classList.remove('hidden');
  }

  function showFail() {
    const overlay = document.getElementById('modalOverlay');
    document.getElementById('modalIcon').textContent = '😢';
    const reason = failInfo ? failInfo.reason : '铁轨没有连通';
    document.getElementById('modalTitle').textContent = reason;
    document.getElementById('modalStars').textContent = '';
    document.getElementById('modalButtons').innerHTML =
      '<button class="ctrl-btn orange" onclick="game.retry()">重试</button>';
    overlay.classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
  }

  // ====== 关卡选择 ======
  function openLevelSelect() {
    const list = document.getElementById('levelList');
    list.innerHTML = '';
    CHAPTERS.forEach((ch, ci) => {
      const title = document.createElement('div');
      title.className = 'chapter-title';
      title.textContent = ch.name;
      list.appendChild(title);
      ch.levels.forEach((_, li) => {
        const idx = ci * 5 + li;
        const btn = document.createElement('div');
        btn.className = 'level-btn' + (idx === currentLevel ? ' current' : '');
        btn.textContent = `${ci + 1}-${li + 1}`;
        btn.addEventListener('click', () => { closeLevelSelect(); loadLevel(idx); });
        list.appendChild(btn);
      });
    });
    document.getElementById('levelSelectOverlay').classList.remove('hidden');
  }

  function closeLevelSelect() {
    document.getElementById('levelSelectOverlay').classList.add('hidden');
  }

  // ====== 公共 API ======
  window.game = {
    run() {
      if (animating) return;
      failInfo = null;
      const result = buildPath();
      if (result.path.length > 0) {
        startTrainAnimation(result.path, !result.success);
      } else {
        showFail();
      }
    },
    resetLevel() { closeModal(); failInfo = null; loadLevel(currentLevel); },
    retry() {
      closeModal();
      trainPos = null;
      trainAnim = null;
      animating = false;
      fuelDisplay = maxFuel;
      // 保留 failInfo，让玩家看到断开位置
    },
    nextLevel() { closeModal(); loadLevel(currentLevel + 1); },
    toggleEraser() {
      eraserMode = !eraserMode;
      if (eraserMode) selectedTool = null;
      document.getElementById('btnEraser').classList.toggle('eraser-active', eraserMode);
      refreshToolbar();
    },
    openLevelSelect,
    closeLevelSelect,
  };

  document.addEventListener('DOMContentLoaded', init);
})();
