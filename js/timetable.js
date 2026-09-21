/* 课表:一周课程表(localStorage 持久化),今天列高亮,点课程删除
   节次时间支持自定义(开始/结束时间,可加可删) */
const TT_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const TT_DEFAULT_PERIODS = [
  { start: '08:00', end: '09:30' },
  { start: '10:00', end: '11:30' },
  { start: '14:00', end: '15:30' },
  { start: '16:00', end: '17:30' },
  { start: '19:00', end: '20:30' }
];
const TT_COLORS = ['#ff6b35', '#4ecdc4', '#45b7d1', '#96c93d', '#f7b731', '#a55eea', '#fd79a8', '#6c8bff'];

function _ttColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TT_COLORS[h % TT_COLORS.length];
}

function _ttPeriods() {
  // 返回数组,空时给默认值
  const arr = Store.get(Store.KEYS.TT_PERIODS, null);
  if (Array.isArray(arr) && arr.length) return arr;
  return TT_DEFAULT_PERIODS;
}

function _ttPeriodLabel(p) {
  // 显示 "1" 节, 副标 "8:00-9:30"
  const periods = _ttPeriods();
  const idx = Math.min(p, periods.length - 1);
  const item = periods[idx] || {};
  const start = item.start || '';
  const end = item.end || '';
  const range = start && end ? `${start}-${end}` : (start || '');
  return { num: idx + 1, range };
}

function _ttRenderPeriodsEditor() {
  const list = $('#tt-periods-list');
  if (!list) return;
  const periods = _ttPeriods();
  list.innerHTML = '';
  periods.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'tt-period-row';
    row.innerHTML = `
      <span class="tt-period-idx">第${i + 1}节</span>
      <input type="time" class="tt-period-start" data-i="${i}" value="${escapeHtml(p.start || '')}" />
      <span class="tt-period-dash">~</span>
      <input type="time" class="tt-period-end" data-i="${i}" value="${escapeHtml(p.end || '')}" />
      <button class="tt-period-del" data-i="${i}" title="删除">✕</button>
    `;
    list.appendChild(row);
  });
}

function _ttRenderPeriodSelect() {
  const sel = $('#tt-period');
  if (!sel) return;
  const periods = _ttPeriods();
  const cur = sel.value;
  sel.innerHTML = '';
  periods.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    const start = p.start || '';
    const end = p.end || '';
    opt.textContent = `第${i + 1}节 ${start}${end ? '-' + end : ''}`;
    sel.appendChild(opt);
  });
  if (cur && parseInt(cur, 10) < periods.length) sel.value = cur;
}

function renderTimetable() {
  const grid = $('#tt-grid');
  const todayBox = $('#tt-today-list');
  if (!grid) return;
  const list = Store.get(Store.KEYS.TIMETABLE, []);
  const today = new Date().getDay();
  const periods = _ttPeriods();

  // 今天标题 + 今天课程列表
  const todayTitle = $('#tt-today-title');
  if (todayTitle) todayTitle.textContent = `📍 今天 · ${TT_DAYS[today]}`;
  if (todayBox) {
    const todays = list.filter(c => c.day === today).sort((a, b) => a.period - b.period);
    todayBox.innerHTML = '';
    if (!todays.length) {
      const li = document.createElement('li');
      li.className = 'note-item';
      li.textContent = '今天没课,自由安排~';
      todayBox.appendChild(li);
    } else {
      todays.forEach(c => {
        const range = _ttPeriodLabel(c.period).range;
        const li = document.createElement('li');
        li.className = 'note-item';
        li.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${_ttColor(c.name)};margin-right:6px;"></span>${range ? `<span style="color:var(--text-secondary);">${range}</span> ` : ''}${escapeHtml(c.name)}${c.room ? `<span style="color:var(--text-secondary);"> · ${escapeHtml(c.room)}</span>` : ''}`;
        todayBox.appendChild(li);
      });
    }
  }

  // 一周网格:表头行
  grid.innerHTML = '';
  const corner = document.createElement('div');
  corner.className = 'tt-time';
  corner.innerHTML = '<span>节</span>';
  grid.appendChild(corner);
  [1, 2, 3, 4, 5, 6, 0].forEach(d => {
    const head = document.createElement('div');
    head.className = 'tt-head' + (d === today ? ' tt-today' : '');
    head.textContent = TT_DAYS[d].replace('周', '');
    grid.appendChild(head);
  });
  // 数据行
  periods.forEach((p, idx) => {
    const tl = document.createElement('div');
    tl.className = 'tt-time';
    const range = (p.start || '') + (p.end ? '-' + p.end : '');
    tl.innerHTML = `<span>${idx + 1}</span><span class="tt-time-range">${escapeHtml(range)}</span>`;
    grid.appendChild(tl);
    [1, 2, 3, 4, 5, 6, 0].forEach(d => {
      const cell = document.createElement('div');
      cell.className = 'tt-cell' + (d === today ? ' tt-today' : '');
      list.filter(c => c.day === d && c.period === idx).forEach(c => {
        const chip = document.createElement('div');
        chip.className = 'tt-chip';
        chip.style.background = _ttColor(c.name);
        chip.innerHTML = `${escapeHtml(c.name)}${c.room ? `<span class="tt-room">${escapeHtml(c.room)}</span>` : ''}`;
        chip.title = `${c.name}${c.room ? ' @' + c.room : ''}${c.teacher ? ' ' + c.teacher : ''}(点击删除)`;
        chip.addEventListener('click', () => {
          if (confirm(`删除课程「${c.name}」?`)) {
            Store.set(Store.KEYS.TIMETABLE, Store.get(Store.KEYS.TIMETABLE, []).filter(x => x.id !== c.id));
            renderTimetable();
          }
        });
        cell.appendChild(chip);
      });
      grid.appendChild(cell);
    });
  });
}

function initTimetable() {
  // 节次时间编辑器
  _ttRenderPeriodsEditor();
  _ttRenderPeriodSelect();

  const periodsList = $('#tt-periods-list');
  if (periodsList) {
    periodsList.addEventListener('click', e => {
      const btn = e.target.closest('.tt-period-del');
      if (!btn) return;
      const i = parseInt(btn.dataset.i, 10);
      const arr = _ttPeriods();
      if (arr.length <= 1) { alert('至少保留一节~'); return; }
      arr.splice(i, 1);
      Store.set(Store.KEYS.TT_PERIODS, arr);
      _ttRenderPeriodsEditor();
      _ttRenderPeriodSelect();
      renderTimetable();
    });
  }

  const addPeriodBtn = $('#tt-period-add');
  if (addPeriodBtn) {
    addPeriodBtn.addEventListener('click', () => {
      const arr = _ttPeriods();
      arr.push({ start: '08:00', end: '09:30' });
      Store.set(Store.KEYS.TT_PERIODS, arr);
      _ttRenderPeriodsEditor();
      _ttRenderPeriodSelect();
      renderTimetable();
    });
  }

  const savePeriodBtn = $('#tt-period-save');
  if (savePeriodBtn) {
    savePeriodBtn.addEventListener('click', () => {
      const arr = _ttPeriods();
      const starts = $$('#tt-periods-list .tt-period-start');
      const ends = $$('#tt-periods-list .tt-period-end');
      const next = arr.map((p, i) => ({
        start: starts[i] ? starts[i].value : (p.start || ''),
        end: ends[i] ? ends[i].value : (p.end || '')
      }));
      if (!Store.set(Store.KEYS.TT_PERIODS, next)) return;
      _ttRenderPeriodsEditor();
      _ttRenderPeriodSelect();
      renderTimetable();
      // 提示
      const toast = document.createElement('div');
      toast.textContent = '✅ 节次时间已保存';
      toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:10px 18px;border-radius:8px;z-index:9999;font-size:13px;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1800);
    });
  }

  const add = $('#tt-add');
  const name = $('#tt-name');
  if (!add || !name) return;

  add.addEventListener('click', () => {
    const n = name.value.trim();
    if (!n) {
      alert('先写上课程名吧~');
      return;
    }
    const list = Store.get(Store.KEYS.TIMETABLE, []);
    const periodIdx = parseInt($('#tt-period').value, 10) || 0;
    list.push({
      id: uid(),
      name: n,
      room: $('#tt-room').value.trim(),
      teacher: $('#tt-teacher').value.trim(),
      day: parseInt($('#tt-day').value, 10),
      period: periodIdx
    });
    Store.set(Store.KEYS.TIMETABLE, list);
    name.value = '';
    $('#tt-room').value = '';
    $('#tt-teacher').value = '';
    renderTimetable();
  });
  name.addEventListener('keydown', e => { if (e.key === 'Enter') add.click(); });

  renderTimetable();
}

if (typeof window !== 'undefined') window.initTimetable = initTimetable;
