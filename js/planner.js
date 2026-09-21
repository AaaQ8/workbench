/* 每日计划(GoalDay 式):时间安排 + 打卡 + 连续天数 + 7天完成率图表 + 到点提醒 */
let _plFilter = 'today';
let _plChart = null;
let _plReminderOn = false;
let _plLastFired = {}; // taskId -> minuteKey "YYYY-MM-DD HH:MM",防同分钟内重复触发

function _plToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function _plDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function _plSort(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  if (a.time && b.time) return a.time.localeCompare(b.time);
  if (a.time) return -1;
  if (b.time) return 1;
  return b.createdAt - a.createdAt;
}

function renderPlanner() {
  const ul = $('#pl-list');
  if (!ul) return;
  const all = Store.get(Store.KEYS.PLANNER, []);
  const today = _plToday();
  const nowTime = new Date().toTimeString().slice(0, 5);

  // 统计:连续完成天数 + 今日概览
  const streakBox = $('#pl-streak');
  if (streakBox) {
    let streak = 0;
    const cur = new Date();
    if (!all.some(t => t.done && t.date === today)) cur.setDate(cur.getDate() - 1);
    while (all.some(t => t.done && t.date === _plDateStr(cur))) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }
    const todays = all.filter(t => t.date === today);
    const doneToday = todays.filter(t => t.done).length;
    streakBox.innerHTML = `🔥 连续完成 <b style="color:var(--accent);">${streak}</b> 天 · 今日 <b>${doneToday}/${todays.length}</b> 项${todays.length ? ` · 完成率 ${Math.round(doneToday / todays.length * 100)}%` : ''}`;
  }

  // 过滤
  let shown = all;
  if (_plFilter === 'today') shown = all.filter(t => t.date === today);
  else if (_plFilter === 'done') shown = all.filter(t => t.done);
  shown = [...shown].sort(_plSort);

  ul.innerHTML = '';
  if (!shown.length) {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.textContent = _plFilter === 'today' ? '今天还没有安排,添加一件想完成的事吧~' : '这里空空的~';
    ul.appendChild(li);
  }
  shown.forEach(t => {
    const overdue = !t.done && t.date === today && t.time && t.time < nowTime;
    const li = document.createElement('li');
    li.className = 'pl-item' + (t.done ? ' pl-done' : '');
    li.dataset.id = t.id;
    li.innerHTML = `
      <button class="pl-check" title="打卡">${t.done ? '✓' : ''}</button>
      <div class="pl-body">
        <div class="pl-title">${t.important ? '<span class="pl-star">⭐</span> ' : ''}${escapeHtml(t.text)}</div>
        <div class="pl-meta">
          <span class="pl-tag">${escapeHtml(t.cat || '其他')}</span>
          ${t.time ? `<span class="${overdue ? 'pl-time-overdue' : ''}">🕐 ${t.time}${overdue ? ' 已超时' : ''}</span>` : ''}
          ${t.date !== today ? `<span>📅 ${t.date.slice(5)}</span>` : ''}
        </div>
      </div>
      <button class="fav-delete pl-del" data-id="${t.id}" title="删除">✕</button>
    `;
    li.querySelector('.pl-check').addEventListener('click', () => {
      const tasks = Store.get(Store.KEYS.PLANNER, []);
      const item = tasks.find(x => x.id === t.id);
      if (!item) return;
      item.done = !item.done;
      Store.set(Store.KEYS.PLANNER, tasks);
      renderPlanner();
    });
    ul.appendChild(li);
  });

  renderPlChart(all, today);
}

function renderPlChart(all, today) {
  const canvas = $('#pl-chart');
  if (!canvas || typeof Chart === 'undefined') return;
  // 最近 7 天完成率
  const labels = [];
  const rates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = _plDateStr(d);
    const dayTasks = all.filter(t => t.date === ds);
    const done = dayTasks.filter(t => t.done).length;
    labels.push(`${d.getMonth() + 1}/${d.getDate()}${ds === today ? '(今)' : ''}`);
    rates.push(dayTasks.length ? Math.round(done / dayTasks.length * 100) : 0);
  }
  // 性能:数据未变则复用已有图表,避免频繁 destroy/recreate
  const dataKey = labels.join('|') + '|' + rates.join(',');
  if (_plChart && _plChart._dataKey === dataKey) return;
  if (_plChart) _plChart.destroy();
  _plChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '完成率 %',
        data: rates,
        backgroundColor: 'rgba(255, 107, 53, .65)',
        borderRadius: 6,
        maxBarThickness: 28
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 100, ticks: { color: '#9a9aa5', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.06)' } },
        x: { ticks: { color: '#9a9aa5', font: { size: 10 } }, grid: { display: false } }
      }
    }
  });
  _plChart._dataKey = dataKey;
}

function initPlanner() {
  const add = $('#pl-add');
  const text = $('#pl-text');
  if (!add || !text) return;

  add.addEventListener('click', () => {
    const v = text.value.trim();
    if (!v) {
      alert('写点什么要做的吧~');
      return;
    }
    const tasks = Store.get(Store.KEYS.PLANNER, []);
    tasks.unshift({
      id: uid(),
      text: v,
      date: _plToday(),
      time: $('#pl-time').value || '',
      cat: $('#pl-cat').value,
      important: false,
      done: false,
      createdAt: Date.now()
    });
    Store.set(Store.KEYS.PLANNER, tasks);
    text.value = '';
    $('#pl-time').value = '';
    renderPlanner();
  });
  text.addEventListener('keydown', e => { if (e.key === 'Enter') add.click(); });

  // 标题旁双击设为重要? 简化:长按不需要,点击标题文字切换⭐
  const filters = $('#pl-filters');
  if (filters) {
    filters.addEventListener('click', e => {
      const btn = e.target.closest('.focus-mode-btn');
      if (!btn) return;
      _plFilter = btn.dataset.f;
      $$('#pl-filters .focus-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPlanner();
    });
  }

  const ul = $('#pl-list');
  if (ul) {
    ul.addEventListener('click', e => {
      const id = e.target.dataset ? e.target.dataset.id : null;
      if (!id) return;
      if (e.target.classList.contains('pl-del')) {
        Store.set(Store.KEYS.PLANNER, Store.get(Store.KEYS.PLANNER, []).filter(x => x.id !== id));
        renderPlanner();
      }
    });
  }

  // 点击任务文字切换 ⭐重要标记
  const ulStar = $('#pl-list');
  if (ulStar) {
    ulStar.addEventListener('click', e => {
      if (!e.target.closest('.pl-title')) return;
      const li = e.target.closest('.pl-item');
      if (!li || e.target.classList.contains('pl-star')) return;
      const tasks = Store.get(Store.KEYS.PLANNER, []);
      const item = tasks.find(x => x.id === li.dataset.id);
      if (!item) return;
      item.important = !item.important;
      Store.set(Store.KEYS.PLANNER, tasks);
      renderPlanner();
    });
  }

  _plInitReminder();
  renderPlanner();
}

/* ===== 任务提醒(到点弹通知 + 蜂鸣声) ===== */
function _plInitReminder() {
  const toggleBtn = $('#pl-reminder-toggle');
  const statusEl = $('#pl-reminder-status');
  // 初始化按钮文字
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    _plReminderOn = true;
    if (statusEl) statusEl.textContent = '已开启 ✅';
    if (toggleBtn) toggleBtn.textContent = '关闭提醒';
  }
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (_plReminderOn) {
        _plReminderOn = false;
        if (statusEl) statusEl.textContent = '未开启';
        toggleBtn.textContent = '开启提醒';
        return;
      }
      // 请求权限
      const proceed = () => {
        _plReminderOn = true;
        if (statusEl) statusEl.textContent = '已开启 ✅';
        toggleBtn.textContent = '关闭提醒';
        showToast('🔔 提醒已开启,到点会弹通知');
      };
      if (typeof Notification === 'undefined') {
        // 不支持通知 API 的浏览器,只走声音提醒
        proceed();
        return;
      }
      if (Notification.permission === 'granted') {
        proceed();
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => {
          if (p === 'granted') proceed();
          else {
            // 用户拒绝通知,仍然开启声音提醒
            _plReminderOn = true;
            if (statusEl) statusEl.textContent = '已开启(无系统通知,仅声音) 🔕';
            toggleBtn.textContent = '关闭提醒';
            showToast('系统通知未授权,仍会用声音提醒');
          }
        });
      } else {
        // 已被拒绝
        _plReminderOn = true;
        if (statusEl) statusEl.textContent = '已开启(系统通知被拒,仅声音) 🔕';
        toggleBtn.textContent = '关闭提醒';
        showToast('系统通知被拒,仍会用声音提醒');
      }
    });
  }
  // 启动轮询
  setInterval(_plReminderTick, 20000); // 每 20 秒检查一次
  _plReminderTick();
}

function _plBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start();
    osc.stop(ctx.currentTime + 1.3);
    // 三声短促蜂鸣
    setTimeout(() => {
      const ctx2 = new (window.AudioContext || window.webkitAudioContext)();
      const o2 = ctx2.createOscillator(), g2 = ctx2.createGain();
      o2.connect(g2); g2.connect(ctx2.destination);
      o2.type = 'sine'; o2.frequency.value = 880;
      g2.gain.setValueAtTime(0.001, ctx2.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.3, ctx2.currentTime + 0.05);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 1.0);
      o2.start(); o2.stop(ctx2.currentTime + 1.1);
    }, 1400);
  } catch (e) { /* AudioContext 不可用时静默 */ }
}

function _plReminderTick() {
  if (!_plReminderOn) return;
  const tasks = Store.get(Store.KEYS.PLANNER, []);
  const today = _plToday();
  const now = new Date();
  const nowHH = String(now.getHours()).padStart(2, '0');
  const nowMM = String(now.getMinutes()).padStart(2, '0');
  const nowTime = `${nowHH}:${nowMM}`;
  let fired = false;
  tasks.forEach(t => {
    if (t.done) return;
    if (t.date !== today) return;
    if (!t.time || t.time.length < 5) return;
    if (t.time !== nowTime) return;
    const minuteKey = `${today} ${nowTime}`;
    if (_plLastFired[t.id] === minuteKey) return; // 本分钟已提醒过
    _plLastFired[t.id] = minuteKey;
    fired = true;
    // 弹通知
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const n = new Notification('⏰ 任务提醒', {
          body: `${t.time} ${t.text}${t.cat ? ' [' + t.cat + ']' : ''}`,
          tag: 'pl-' + t.id
        });
        n.onclick = () => { window.focus(); n.close(); };
      }
    } catch (e) {}
    // 页内 toast
    showToast(`⏰ ${t.time} · ${t.text}`);
  });
  if (fired) _plBeep();
}

if (typeof window !== 'undefined') window.initPlanner = initPlanner;
