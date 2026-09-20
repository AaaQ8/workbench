/* 每日计划(GoalDay 式):时间安排 + 打卡 + 连续天数 + 7天完成率图表 */
let _plFilter = 'today';
let _plChart = null;

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

  renderPlanner();
}

if (typeof window !== 'undefined') window.initPlanner = initPlanner;
