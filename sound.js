// sound.js — 小火车铺铁路 音效系统 (Web Audio API 合成)
(function () {
  'use strict';

  let audioCtx = null;
  let bgmGain = null;
  let sfxGain = null;
  let bgmPlaying = false;
  let bgmNodes = [];
  let initialized = false;
  let muted = false;

  // 懒初始化 AudioContext（需用户交互后才能创建）
  function ensureCtx() {
    if (audioCtx) return true;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      bgmGain = audioCtx.createGain();
      bgmGain.gain.value = 0.25;
      bgmGain.connect(audioCtx.destination);
      sfxGain = audioCtx.createGain();
      sfxGain.gain.value = 0.45;
      sfxGain.connect(audioCtx.destination);
      initialized = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  function resumeCtx() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // ====== 工具函数 ======
  function playNote(freq, type, startTime, duration, gainVal, dest) {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(g);
    g.connect(dest || sfxGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
    return osc;
  }

  function playNoise(startTime, duration, gainVal, dest) {
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    src.connect(filter);
    filter.connect(g);
    g.connect(dest || sfxGain);
    src.start(startTime);
    src.stop(startTime + duration);
  }

  // ====== 音效 ======

  // 放置铁轨 - 清脆的"咔嗒"声
  function playPlace() {
    if (!ensureCtx() || muted) return;
    const t = audioCtx.currentTime;
    playNote(800, 'square', t, 0.06, 0.3);
    playNote(1200, 'square', t + 0.02, 0.05, 0.2);
    playNoise(t, 0.04, 0.15);
  }

  // 擦除铁轨 - 下降的"嗖"声
  function playErase() {
    if (!ensureCtx() || muted) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // 选择工具 - 轻柔的点击
  function playSelect() {
    if (!ensureCtx() || muted) return;
    const t = audioCtx.currentTime;
    playNote(1000, 'sine', t, 0.04, 0.15);
    playNote(1500, 'sine', t + 0.015, 0.03, 0.1);
  }

  // 火车出发 - 汽笛声
  function playWhistle() {
    if (!ensureCtx() || muted) return;
    const t = audioCtx.currentTime;
    // 主音
    const osc1 = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(440, t);
    osc1.frequency.setValueAtTime(520, t + 0.1);
    osc1.frequency.setValueAtTime(520, t + 0.35);
    osc1.frequency.exponentialRampToValueAtTime(440, t + 0.5);
    g1.gain.setValueAtTime(0.001, t);
    g1.gain.linearRampToValueAtTime(0.2, t + 0.05);
    g1.gain.setValueAtTime(0.2, t + 0.35);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc1.connect(g1);
    g1.connect(sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.5);

    // 和音
    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(660, t);
    osc2.frequency.setValueAtTime(780, t + 0.1);
    osc2.frequency.setValueAtTime(780, t + 0.35);
    osc2.frequency.exponentialRampToValueAtTime(660, t + 0.5);
    g2.gain.setValueAtTime(0.001, t);
    g2.gain.linearRampToValueAtTime(0.1, t + 0.05);
    g2.gain.setValueAtTime(0.1, t + 0.35);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc2.connect(g2);
    g2.connect(sfxGain);
    osc2.start(t);
    osc2.stop(t + 0.5);
  }

  // 火车行进 - 节奏感的"咔嚓咔嚓"
  let chugInterval = null;
  function startChug() {
    if (!ensureCtx() || muted) return;
    stopChug();
    function doChug() {
      if (!audioCtx || muted) return;
      const t = audioCtx.currentTime;
      playNoise(t, 0.06, 0.08);
      playNote(120, 'square', t, 0.05, 0.1);
      playNoise(t + 0.15, 0.06, 0.06);
      playNote(100, 'square', t + 0.15, 0.05, 0.08);
    }
    doChug();
    chugInterval = setInterval(doChug, 300);
  }

  function stopChug() {
    if (chugInterval) {
      clearInterval(chugInterval);
      chugInterval = null;
    }
  }

  // 过关胜利 - 欢快上升旋律
  function playWin() {
    if (!ensureCtx() || muted) return;
    const t = audioCtx.currentTime;
    const notes = [523, 587, 659, 784, 880, 1047]; // C5 D5 E5 G5 A5 C6
    notes.forEach((freq, i) => {
      playNote(freq, 'square', t + i * 0.1, 0.2, 0.2);
      playNote(freq * 1.5, 'sine', t + i * 0.1, 0.15, 0.08); // 和音泛音
    });
    // 最后一个音长一点
    playNote(1047, 'triangle', t + 0.6, 0.6, 0.25);
    playNote(1568, 'sine', t + 0.6, 0.5, 0.1);
  }

  // 失败 - 下行音调
  function playFail() {
    if (!ensureCtx() || muted) return;
    const t = audioCtx.currentTime;
    playNote(400, 'square', t, 0.2, 0.2);
    playNote(350, 'square', t + 0.2, 0.2, 0.2);
    playNote(300, 'triangle', t + 0.4, 0.5, 0.25);
  }

  // 按钮点击
  function playClick() {
    if (!ensureCtx() || muted) return;
    const t = audioCtx.currentTime;
    playNote(700, 'sine', t, 0.03, 0.12);
  }

  // 星星获得（弹窗中显示星星时）
  function playStar(index) {
    if (!ensureCtx() || muted) return;
    const t = audioCtx.currentTime;
    const freq = [880, 1108, 1320][index] || 880;
    playNote(freq, 'sine', t, 0.3, 0.15);
    playNote(freq * 2, 'sine', t + 0.05, 0.2, 0.06);
  }

  // ====== 背景音乐 - 简约欢快循环 ======
  function startBGM() {
    if (!ensureCtx() || bgmPlaying || muted) return;
    bgmPlaying = true;

    // C大调欢快旋律，每小节4拍，BPM=120
    const bpm = 120;
    const beatDur = 60 / bpm;

    // 旋律音符 [频率, 起始拍, 持续拍数]
    const melody = [
      // 第1小节
      [523, 0, 0.5], [587, 0.5, 0.5], [659, 1, 1], [784, 2, 0.5], [659, 2.5, 0.5], [587, 3, 1],
      // 第2小节
      [523, 4, 0.5], [587, 4.5, 0.5], [659, 5, 0.5], [784, 5.5, 0.5], [880, 6, 1], [784, 7, 1],
      // 第3小节
      [659, 8, 1], [523, 9, 0.5], [587, 9.5, 0.5], [659, 10, 1], [523, 11, 1],
      // 第4小节
      [587, 12, 0.5], [659, 12.5, 0.5], [784, 13, 1], [659, 14, 1], [523, 15, 1],
    ];

    // 低音伴奏 [频率, 起始拍, 持续拍数]
    const bass = [
      [131, 0, 2], [165, 2, 2],
      [175, 4, 2], [196, 6, 2],
      [131, 8, 2], [175, 10, 2],
      [196, 12, 2], [131, 14, 2],
    ];

    const totalBeats = 16;
    const loopDur = totalBeats * beatDur;

    function scheduleLoop() {
      if (!bgmPlaying || !audioCtx) return;
      const startT = audioCtx.currentTime + 0.05;

      melody.forEach(([freq, beat, dur]) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const st = startT + beat * beatDur;
        const ed = st + dur * beatDur * 0.9;
        g.gain.setValueAtTime(0.001, st);
        g.gain.linearRampToValueAtTime(0.12, st + 0.02);
        g.gain.setValueAtTime(0.12, ed - 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, ed);
        osc.connect(g);
        g.connect(bgmGain);
        osc.start(st);
        osc.stop(ed + 0.01);
        bgmNodes.push(osc);
      });

      bass.forEach(([freq, beat, dur]) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const st = startT + beat * beatDur;
        const ed = st + dur * beatDur * 0.85;
        g.gain.setValueAtTime(0.001, st);
        g.gain.linearRampToValueAtTime(0.08, st + 0.03);
        g.gain.setValueAtTime(0.08, ed - 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, ed);
        osc.connect(g);
        g.connect(bgmGain);
        osc.start(st);
        osc.stop(ed + 0.01);
        bgmNodes.push(osc);
      });

      // 调度下一个循环
      bgmNodes = bgmNodes.filter(n => {
        try { n._alive = true; return true; } catch (e) { return false; }
      });
      setTimeout(scheduleLoop, loopDur * 1000 - 100);
    }

    scheduleLoop();
  }

  function stopBGM() {
    bgmPlaying = false;
    bgmNodes.forEach(n => { try { n.stop(); } catch (e) {} });
    bgmNodes = [];
  }

  function toggleMute() {
    muted = !muted;
    if (muted) {
      stopBGM();
      stopChug();
    } else {
      startBGM();
    }
    return muted;
  }

  // ====== 公开 API ======
  window.sound = {
    init() {
      ensureCtx();
      resumeCtx();
      if (!muted) startBGM();
    },
    playPlace,
    playErase,
    playSelect,
    playWhistle,
    startChug,
    stopChug,
    playWin,
    playFail,
    playClick,
    playStar,
    startBGM,
    stopBGM,
    toggleMute,
    get muted() { return muted; },
  };
})();
