/* 课表:一周课程表(localStorage 持久化),今天列高亮,点课程删除 */
const TT_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const TT_PERIODS = ['8:00', '10:00', '14:00', '16:00', '19:00'];
const TT_COLORS = ['#ff6b35', '#4ecdc4', '#45b7d1', '#96c93d', '#f7b731', '#a55eea', '#fd79a8', '#6c8bff'];

function _ttColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TT_COLORS[h % TT_COLORS.length];
}

function renderTimetable() {
  const grid = $('#tt-grid');
  const todayBox = $('#tt-today-list');
  if (!grid) return;
  const list = Store.get(Store.KEYS.TIMETABLE, []);
  const today = new Date().getDay();

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
        const li = document.createElement('li');
        li.className = 'note-item';
        li.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${_ttColor(c.name)};margin-right:6px;"></span>第${c.period + 1}节 ${escapeHtml(c.name)}${c.room ? `<span style="color:var(--text-secondary);"> · ${escapeHtml(c.room)}</span>` : ''}`;
        todayBox.appendChild(li);
      });
    }
  }

  // 一周网格:表头 行
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
  TT_PERIODS.forEach((time, p) => {
    const tl = document.createElement('div');
    tl.className = 'tt-time';
    tl.innerHTML = `<span>${p + 1}</span><span>${time}</span>`;
    grid.appendChild(tl);
    [1, 2, 3, 4, 5, 6, 0].forEach(d => {
      const cell = document.createElement('div');
      cell.className = 'tt-cell' + (d === today ? ' tt-today' : '');
      list.filter(c => c.day === d && c.period === p).forEach(c => {
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
    list.push({
      id: uid(),
      name: n,
      room: $('#tt-room').value.trim(),
      teacher: $('#tt-teacher').value.trim(),
      day: parseInt($('#tt-day').value, 10),
      period: parseInt($('#tt-period').value, 10)
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
