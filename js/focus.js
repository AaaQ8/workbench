const focusState = {
  running: false,
  remaining: 25 * 60,
  total: 25 * 60,
  timer: null,
};

function renderFocus() {
  const timeEl = $('#focus-time');
  if (!timeEl) return;
  const m = Math.floor(focusState.remaining / 60);
  const s = focusState.remaining % 60;
  timeEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startFocus() {
  if (focusState.running) {
    clearInterval(focusState.timer);
    focusState.running = false;
    const btn = $('#focus-start');
    if (btn) btn.textContent = '继续';
    return;
  }
  focusState.running = true;
  const btn = $('#focus-start');
  if (btn) btn.textContent = '暂停';
  focusState.timer = setInterval(() => {
    focusState.remaining--;
    if (focusState.remaining <= 0) {
      endFocus();
    }
    renderFocus();
  }, 1000);
}

function endFocus() {
  clearInterval(focusState.timer);
  focusState.running = false;
  const minutes = focusState.total / 60;
  const total = Store.get(Store.KEYS.FOCUS_TOTAL, 0) + minutes;
  const today = Store.get(Store.KEYS.FOCUS_TODAY, 0) + minutes;
  Store.set(Store.KEYS.FOCUS_TOTAL, total);
  Store.set(Store.KEYS.FOCUS_TODAY, today);
  Store.set('pw_focus_count', Store.get('pw_focus_count', 0) + 1);
  recordFocusHistory(minutes);
  const btn = $('#focus-start');
  if (btn) btn.textContent = '开始';
  setFocusDuration(focusState.total / 60);
  renderFocus();
  updateFocusStats();
  renderFocusChart();
  playBeep();
  if (typeof Notify !== 'undefined') {
    Notify.push('🎉 专注完成', { body: `已专注 ${minutes} 分钟,休息一下吧~`, tag: 'focus-done' });
  } else {
    setTimeout(() => alert(`专注完成！🎉 已专注 ${minutes} 分钟`), 100);
  }
}

/* ---------- 专注历史记录 + 图表(Chart.js) ---------- */
function recordFocusHistory(minutes) {
  const hist = Store.get(Store.KEYS.FOCUS_HISTORY, {});
  const d = formatDate(Date.now());
  hist[d] = (hist[d] || 0) + minutes;
  Store.set(Store.KEYS.FOCUS_HISTORY, hist);
}

let focusHistChart = null;

function renderFocusChart() {
  if (typeof Chart === 'undefined') return;
  const canvas = $('#focus-history-chart');
  if (!canvas) return;
  const css = getComputedStyle(document.documentElement);
  Chart.defaults.color = css.getPropertyValue('--text-secondary').trim() || '#9a9aa6';
  Chart.defaults.borderColor = css.getPropertyValue('--border').trim() || '#2a2a33';
  const accent = css.getPropertyValue('--accent').trim() || '#ff6b35';
  const hist = Store.get(Store.KEYS.FOCUS_HISTORY, {});

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(formatDate(d.getTime()));
  }

  if (focusHistChart) focusHistChart.destroy();
  focusHistChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: days.map(d => d.slice(5)),
      datasets: [{
        label: '专注分钟',
        data: days.map(d => hist[d] || 0),
        backgroundColor: accent,
        borderRadius: 4
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function resetFocus() {
  clearInterval(focusState.timer);
  focusState.running = false;
  const btn = $('#focus-start');
  if (btn) btn.textContent = '开始';
  focusState.remaining = focusState.total;
  renderFocus();
}

function setFocusDuration(min) {
  focusState.total = min * 60;
  focusState.remaining = min * 60;
  const modeEl = $('#focus-mode');
  if (modeEl) {
    if (min === 5) modeEl.textContent = '休息模式';
    else if (min >= 45) modeEl.textContent = '深度专注';
    else modeEl.textContent = '专注模式';
  }
  renderFocus();
}

// 分钟数转友好时长:125 -> "2小时5分"
function _fmtFocusDuration(min) {
  min = Math.round(min || 0);
  if (min < 60) return min + ' 分钟';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}小时${m}分` : `${h}小时`;
}

function updateFocusStats() {
  const today = Store.get(Store.KEYS.FOCUS_TODAY, 0);
  const total = Store.get(Store.KEYS.FOCUS_TOTAL, 0);
  const count = Store.get('pw_focus_count', 0);
  const tEl = $('#focus-today');
  const totEl = $('#focus-total');
  if (tEl) tEl.textContent = _fmtFocusDuration(today);
  if (totEl) totEl.textContent = _fmtFocusDuration(total);
  const cntEl = $('#focus-count');
  if (cntEl) cntEl.textContent = count;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

function initFocus() {
  renderFocus();
  updateFocusStats();
  renderFocusChart();
  const start = $('#focus-start');
  const reset = $('#focus-reset');
  if (start) start.addEventListener('click', startFocus);
  if (reset) reset.addEventListener('click', resetFocus);
  $$('.focus-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.focus-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setFocusDuration(parseInt(btn.dataset.min));
    });
  });
}
