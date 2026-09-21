/* 专注白噪音:Web Audio 本地合成,无需联网无素材文件 */
let _noise = { ctx: null, nodes: [], timers: [], current: null, master: null };

function _stopNoise() {
  _noise.timers.forEach(t => { clearInterval(t); clearTimeout(t); });
  _noise.nodes.forEach(n => { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
  if (_noise.master) { try { _noise.master.disconnect(); } catch (e) {} }
  _noise.nodes = [];
  _noise.timers = [];
  _noise.current = null;
  _noise.master = null;
  $$('.noise-item').forEach(el => el.classList.remove('active'));
}

function _noiseBuffer(ctx, type) {
  // type: 'white' | 'brown' | 'pink-ish'
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (type === 'brown') {
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    } else {
      data[i] = w;
    }
  }
  return buf;
}

function _lfo(ctx, param, freq, depth, base) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.value = freq;
  g.gain.value = depth;
  if (base !== undefined) param.value = base;
  osc.connect(g);
  g.connect(param);
  osc.start();
  _noise.nodes.push(osc, g);
}

function _source(ctx, buffer) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.start();
  _noise.nodes.push(src);
  return src;
}

function _filter(ctx, type, freq, q) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  if (q) f.Q.value = q;
  _noise.nodes.push(f);
  return f;
}

function _gain(ctx, v) {
  const g = ctx.createGain();
  g.gain.value = v;
  _noise.nodes.push(g);
  return g;
}

function _cricket(ctx, out) {
  // 深夜虫鸣:高频短促颤音
  const chirp = () => {
    if (_noise.current !== 'night') return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const now = ctx.currentTime;
    const f0 = 4200 + Math.random() * 800;
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.setValueAtTime(f0 * 1.04, now + 0.03);
    osc.frequency.setValueAtTime(f0, now + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.03 + Math.random() * 0.02, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(g); g.connect(out);
    osc.start(now);
    osc.stop(now + 0.1);
  };
  const sched = () => {
    if (_noise.current !== 'night') return;
    const n = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) setTimeout(chirp, i * 150);
    _noise.timers.push(setTimeout(sched, 1200 + Math.random() * 4000));
  };
  _noise.timers.push(setTimeout(sched, 600));
}

function _bowl(ctx, out) {
  // 冥想钵:低沉正弦长音 + 偶发高频泛音
  const playBowl = () => {
    if (_noise.current !== 'meditation') return;
    const now = ctx.currentTime;
    const base = 196 + Math.random() * 30; // G3 附近
    [base, base * 2, base * 3].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      const g = ctx.createGain();
      const peak = i === 0 ? 0.12 : (0.04 - i * 0.012);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(peak, now + 0.1 + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 4 + i);
      osc.connect(g); g.connect(out);
      osc.start(now);
      osc.stop(now + 5 + i);
    });
  };
  const sched = () => {
    if (_noise.current !== 'meditation') return;
    playBowl();
    _noise.timers.push(setTimeout(sched, 6000 + Math.random() * 4000));
  };
  _noise.timers.push(setTimeout(sched, 200));
}

function _bird(ctx, out) {
  // 森林鸟鸣:正弦扫频短音
  const chirp = () => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const now = ctx.currentTime;
    const f0 = 2200 + Math.random() * 1200;
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.linearRampToValueAtTime(f0 + 600 + Math.random() * 800, now + 0.07);
    osc.frequency.linearRampToValueAtTime(f0 - 200, now + 0.16);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.05 + Math.random() * 0.04, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(g); g.connect(out);
    osc.start(now);
    osc.stop(now + 0.25);
  };
  const sched = () => {
    if (_noise.current !== 'forest') return;
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) setTimeout(chirp, i * (120 + Math.random() * 150));
    _noise.timers.push(setTimeout(sched, 1800 + Math.random() * 6000));
  };
  _noise.timers.push(setTimeout(sched, 800));
}

function startNoise(kind) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  _stopNoise();
  if (_noise.ctx && _noise.ctx.state === 'suspended') _noise.ctx.resume();
  if (!_noise.ctx) _noise.ctx = new AC();
  const ctx = _noise.ctx;
  const master = _gain(ctx, 0.9);
  master.connect(ctx.destination);
  _noise.master = master;
  _noise.current = kind;

  const white = _noiseBuffer(ctx, 'white');
  const brown = _noiseBuffer(ctx, 'brown');

  switch (kind) {
    case 'rain': {
      // 雨声:宽带白噪 + 低通,轻微起伏
      const src = _source(ctx, white);
      const lp = _filter(ctx, 'lowpass', 2200, 0.6);
      const hp = _filter(ctx, 'highpass', 300);
      const g = _gain(ctx, 0.28);
      _lfo(ctx, g.gain, 0.15, 0.06);
      src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(master);
      break;
    }
    case 'stream': {
      // 溪流:白噪 + 带通(中高频) + 轻微起伏,清亮流水感
      const src = _source(ctx, white);
      const bp = _filter(ctx, 'bandpass', 1800, 0.8);
      const hp = _filter(ctx, 'highpass', 800);
      const g = _gain(ctx, 0.22);
      _lfo(ctx, g.gain, 0.2, 0.08);
      src.connect(hp); hp.connect(bp); bp.connect(g); g.connect(master);
      break;
    }
    case 'meditation': {
      // 冥想钵:极轻底噪 + 偶发钵音
      const src = _source(ctx, brown);
      const lp = _filter(ctx, 'lowpass', 200);
      const g = _gain(ctx, 0.06);
      src.connect(lp); lp.connect(g); g.connect(master);
      _bowl(ctx, master);
      break;
    }
    case 'fan': {
      // 风扇:棕噪 + 带通(中频) + 稳定小幅起伏
      const src = _source(ctx, brown);
      const bp = _filter(ctx, 'bandpass', 500, 0.5);
      const g = _gain(ctx, 0.4);
      _lfo(ctx, g.gain, 0.5, 0.06);
      src.connect(bp); bp.connect(g); g.connect(master);
      break;
    }
    case 'forest': {
      // 森林:轻柔风声 + 鸟鸣
      const src = _source(ctx, white);
      const lp = _filter(ctx, 'lowpass', 380);
      const g = _gain(ctx, 0.18);
      _lfo(ctx, g.gain, 0.08, 0.1);
      src.connect(lp); lp.connect(g); g.connect(master);
      _bird(ctx, master);
      break;
    }
    case 'night': {
      // 深夜:极轻低频底噪 + 虫鸣
      const src = _source(ctx, brown);
      const lp = _filter(ctx, 'lowpass', 280);
      const g = _gain(ctx, 0.12);
      src.connect(lp); lp.connect(g); g.connect(master);
      _cricket(ctx, master);
      break;
    }
  }

  const el = document.querySelector(`.noise-item[data-sound="${kind}"]`);
  if (el) el.classList.add('active');
}

function initNoise() {
  const grid = document.querySelector('.noise-grid');
  if (!grid) return;
  grid.addEventListener('click', e => {
    const item = e.target.closest('.noise-item');
    if (!item) return;
    const kind = item.dataset.sound;
    if (!kind) return;
    if (_noise.current === kind) _stopNoise();
    else startNoise(kind);
  });
}

if (typeof window !== 'undefined') {
  window.initNoise = initNoise;
  window.stopNoise = _stopNoise;
}
