const ACHIEVEMENTS = [
  { id: 'first_task',     emoji: '🎯', name: '迈出第一步',   desc: '完成第一个任务' },
  { id: 'ten_tasks',      emoji: '🔥', name: '小有成就',     desc: '累计完成 10 个任务' },
  { id: 'hundred_tasks',  emoji: '🏆', name: '任务大师',     desc: '累计完成 100 个任务' },
  { id: 'first_focus',    emoji: '🧘', name: '进入专注',     desc: '完成第一次专注' },
  { id: 'ten_focus',      emoji: '⚡', name: '专注达人',     desc: '累计专注 10 次' },
  { id: 'first_note',     emoji: '📝', name: '记录灵感',     desc: '写下第一条笔记' },
  { id: 'three_notes',    emoji: '📚', name: '知识积累',     desc: '写下 3 条笔记' },
  { id: 'first_goal',     emoji: '⭐', name: '确立目标',     desc: '添加第一个目标' },
];

let _achievementChecked = {};

function checkAchievements() {
  const unlocked = Store.get(Store.KEYS.ACHIEVEMENTS, {});
  const tasks = Store.get(Store.KEYS.TODOS, []);
  const doneCount = tasks.filter(t => t.done).length;
  const totalFocus = Store.get(Store.KEYS.FOCUS_TOTAL, 0);
  const notes = Store.get(Store.KEYS.NOTES, []).length;
  const goals = [
    ...Store.get(Store.KEYS.YEAR_GOALS, []),
    ...Store.get(Store.KEYS.SHORT_GOALS, []),
  ];

  const rules = [
    { id: 'first_task',    cond: doneCount >= 1 },
    { id: 'ten_tasks',     cond: doneCount >= 10 },
    { id: 'hundred_tasks', cond: doneCount >= 100 },
    { id: 'first_focus',   cond: totalFocus > 0 },
    { id: 'ten_focus',     cond: totalFocus >= 10 },
    { id: 'first_note',    cond: notes >= 1 },
    { id: 'three_notes',   cond: notes >= 3 },
    { id: 'first_goal',    cond: goals.length >= 1 },
  ];

  rules.forEach(r => {
    if (r.cond && !unlocked[r.id]) {
      unlocked[r.id] = Date.now();
      const a = ACHIEVEMENTS.find(x => x.id === r.id);
      if (a && !_achievementChecked[r.id]) {
        _achievementChecked[r.id] = true;
        showToast(`🏆 成就解锁:${a.name}`);
      }
    }
  });

  Store.set(Store.KEYS.ACHIEVEMENTS, unlocked);
  loadAchievements();
}

function showToast(text) {
  let toast = document.getElementById('achievement-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'achievement-toast';
    toast.style.cssText = 'position:fixed;top:80px;right:20px;background:#1a1a2e;color:#fff;padding:14px 20px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.3);z-index:9999;opacity:0;transform:translateY(-10px);transition:all .3s;font-size:14px;';
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
  }, 3000);
}

function updateClock() {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const date = `${now.getMonth() + 1}月${now.getDate()}日 周${days[now.getDay()]}`;
  const clockEl = $('#clock');
  const dateEl  = $('#date');
  if (clockEl) clockEl.textContent = time;
  if (dateEl)  dateEl.textContent  = date;
}

function formatTimeLeft(ms) {
  if (ms <= 0) return { days: '00', hours: '00', min: '00', sec: '00' };
  const total = Math.floor(ms / 1000);
  return {
    days:  String(Math.floor(total / 86400)).padStart(2, '0'),
    hours: String(Math.floor((total % 86400) / 3600)).padStart(2, '0'),
    min:   String(Math.floor((total % 3600) / 60)).padStart(2, '0'),
    sec:   String(total % 60).padStart(2, '0')
  };
}

function startCountdown() {
  const cd = Store.get(Store.KEYS.COUNTDOWN, { name: '', date: null });
  const dEl = $('#cd-days'), hEl = $('#cd-hours'), mEl = $('#cd-min'), sEl = $('#cd-sec');
  const nEl = $('#cd-name');
  if (!dEl) return;

  if (!cd.date) {
    dEl.textContent = hEl.textContent = mEl.textContent = sEl.textContent = '00';
    if (nEl) nEl.textContent = '设置一个倒计时目标吧 →';
    return;
  }
  const target = new Date(cd.date).getTime();
  const tick = () => {
    const left = formatTimeLeft(target - Date.now());
    dEl.textContent = left.days;
    hEl.textContent = left.hours;
    mEl.textContent = left.min;
    sEl.textContent = left.sec;
    if (nEl) nEl.textContent = cd.name ? `目标:${cd.name}` : '';
  };
  tick();
  setInterval(tick, 1000);
}

function initTabs() {
  const sidebar = $('#sidebar');

  // 创建移动端遮罩层
  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  const isMobile   = () => window.innerWidth <= 768;
  const openDrawer = () => { sidebar.classList.add('open'); backdrop.classList.add('show'); document.body.classList.add('drawer-open'); };
  const closeDrawer = () => { sidebar.classList.remove('open'); backdrop.classList.remove('show'); document.body.classList.remove('drawer-open'); };

  $$('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      $$('.nav-item').forEach(t => t.classList.remove('active'));
      $$('.tab-panel').forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      const panelId = 'panel-' + item.dataset.panel;
      const panel = document.getElementById(panelId);
      if (panel) panel.classList.add('active');
      window.scrollTo(0, 0);
      // 移动端选择模块后自动收起抽屉,露出内容
      if (isMobile()) closeDrawer();
    });
  });

  $$('.group-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const groupId = btn.dataset.group;
      const nav = document.getElementById(groupId);
      if (!nav) return;
      const group = btn.closest('.sidebar-group');
      if (group) group.classList.toggle('collapsed');
      btn.classList.toggle('collapsed');
    });
  });

  const toggleBtn = $('#sidebar-toggle');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      if (sidebar.classList.contains('open')) closeDrawer();
      else openDrawer();
    });
  }
  backdrop.addEventListener('click', closeDrawer);
  window.addEventListener('resize', () => {
    if (!isMobile()) backdrop.classList.remove('show');
  });
}

function loadTodos() {
  const todos = Store.get(Store.KEYS.TODOS, []);
  const ul = $('#todo-list');
  if (!ul) return;
  ul.innerHTML = '';
  todos.forEach(t => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (t.done ? ' done' : '');
    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${t.done ? 'checked' : ''} data-id="${t.id}" />
      <span class="todo-text">${escapeHtml(t.text)}</span>
      <button class="todo-delete" data-id="${t.id}">✕</button>
    `;
    ul.appendChild(li);
  });
}

function initTodos() {
  const addBtn = $('#todo-add');
  const input  = $('#todo-input');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const text = input.value.trim();
      if (!text) return;
      const todos = Store.get(Store.KEYS.TODOS, []);
      todos.unshift({ id: uid(), text, done: false, createdAt: Date.now() });
      Store.set(Store.KEYS.TODOS, todos);
      input.value = '';
      loadTodos();
      updateStats();
      checkAchievements();
    });
  }
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') addBtn.click();
    });
  }
  const ul = $('#todo-list');
  if (ul) {
    ul.addEventListener('change', e => {
      if (e.target.classList.contains('todo-checkbox')) {
        const id = e.target.dataset.id;
        const todos = Store.get(Store.KEYS.TODOS, []);
        const t = todos.find(x => x.id === id);
        if (t) {
          t.done = e.target.checked;
          Store.set(Store.KEYS.TODOS, todos);
          loadTodos();
          updateStats();
          checkAchievements();
        }
      }
    });
    ul.addEventListener('click', e => {
      if (e.target.classList.contains('todo-delete')) {
        const id = e.target.dataset.id;
        const todos = Store.get(Store.KEYS.TODOS, []).filter(x => x.id !== id);
        Store.set(Store.KEYS.TODOS, todos);
        loadTodos();
        updateStats();
      }
    });
  }
}

function initQuickNote() {
  const ta = $('#quick-note');
  const btn = $('#save-quicknote');
  if (ta) {
    const saved = Store.get(Store.KEYS.QUICK_NOTE, '');
    if (saved) ta.value = saved;
    ta.addEventListener('input', () => {
      Store.set(Store.KEYS.QUICK_NOTE, ta.value);
    });
  }
  if (btn) {
    btn.addEventListener('click', () => {
      const text = ta ? ta.value.trim() : '';
      if (!text) return;
      const notes = Store.get(Store.KEYS.NOTES, []);
      notes.unshift({
        id: uid(),
        title: '灵感速记',
        content: text,
        createdAt: Date.now()
      });
      Store.set(Store.KEYS.NOTES, notes);
      Store.set(Store.KEYS.QUICK_NOTE, '');
      if (ta) ta.value = '';
      updateStats();
      checkAchievements();
      showToast('✅ 已追加到笔记库');
    });
  }
}

function loadAchievements() {
  const unlocked = Store.get(Store.KEYS.ACHIEVEMENTS, {});
  const div = $('#achievement-list');
  if (!div) return;
  div.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const unlockedAt = unlocked[a.id];
    const el = document.createElement('div');
    el.className = 'achievement-badge' + (unlockedAt ? '' : ' locked');
    el.innerHTML = `
      <div class="achievement-emoji">${unlockedAt ? a.emoji : '🔒'}</div>
      <div class="achievement-name">${a.name}</div>
      <div class="achievement-desc">${a.desc}</div>
    `;
    div.appendChild(el);
  });
}

function updateStats() {
  const tasks = Store.get(Store.KEYS.TODOS, []);
  const tEl  = $('#stat-tasks');
  const fEl  = $('#stat-focus');
  const nEl  = $('#stat-notes');
  const tdEl = $('#stat-today');
  if (tEl)  tEl.textContent  = tasks.filter(t => t.done).length;
  if (fEl)  fEl.textContent  = Store.get(Store.KEYS.FOCUS_TODAY, 0);
  if (nEl)  nEl.textContent  = Store.get(Store.KEYS.NOTES, []).length;
  if (tdEl) {
    const today = new Date().toDateString();
    tdEl.textContent = tasks.filter(t => t.done && new Date(t.createdAt).toDateString() === today).length;
  }
}

function safeInit(name, fn) {
  try {
    if (typeof fn === 'function') fn();
  } catch (err) {
    console.warn(`[init:${name}] 初始化失败:`, err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Store.dailyReset();
  updateClock();
  setInterval(updateClock, 1000);
  initTabs();
  startCountdown();
  initTodos();
  loadTodos();
  updateStats();
  loadAchievements();
  initQuickNote();
  checkAchievements();

  safeInit('meta',      typeof window.initMeta      !== 'undefined' ? window.initMeta      : null);
  safeInit('goals',     typeof window.initGoals     !== 'undefined' ? window.initGoals     : null);
  safeInit('knowledge', typeof window.initKnowledge !== 'undefined' ? window.initKnowledge : null);
  safeInit('dance',     typeof window.initDance     !== 'undefined' ? window.initDance     : null);
  safeInit('sing',      typeof window.initSing      !== 'undefined' ? window.initSing      : null);
  safeInit('study',     typeof window.initStudy     !== 'undefined' ? window.initStudy     : null);
  safeInit('english',   typeof window.initEnglish   !== 'undefined' ? window.initEnglish   : null);
  safeInit('express',   typeof window.initExpress   !== 'undefined' ? window.initExpress   : null);
  safeInit('law',       typeof window.initLaw       !== 'undefined' ? window.initLaw       : null);
  safeInit('wellness',  typeof window.initWellness  !== 'undefined' ? window.initWellness  : null);
  safeInit('books',     typeof window.initBooks     !== 'undefined' ? window.initBooks     : null);
  safeInit('phone',     typeof window.initPhone     !== 'undefined' ? window.initPhone     : null);
  safeInit('timetable', typeof window.initTimetable !== 'undefined' ? window.initTimetable : null);
  safeInit('planner',   typeof window.initPlanner   !== 'undefined' ? window.initPlanner   : null);
  safeInit('outfit',    typeof window.initOutfit    !== 'undefined' ? window.initOutfit    : null);
  safeInit('makeup',    typeof window.initMakeup    !== 'undefined' ? window.initMakeup    : null);
  safeInit('finance',   typeof window.initFinance   !== 'undefined' ? window.initFinance   : null);
  safeInit('news',      typeof window.initNews      !== 'undefined' ? window.initNews      : null);
  safeInit('podcast',   typeof window.initPodcast   !== 'undefined' ? window.initPodcast   : null);
  safeInit('aistudy',   typeof window.initAistudy   !== 'undefined' ? window.initAistudy   : null);
  safeInit('favorites', typeof window.initFavorites !== 'undefined' ? window.initFavorites : null);
  safeInit('edit',      typeof window.initEdit      !== 'undefined' ? window.initEdit      : null);
  safeInit('focus',     typeof window.initFocus     !== 'undefined' ? window.initFocus     : null);
  safeInit('noise',     typeof window.initNoise     !== 'undefined' ? window.initNoise     : null);
  safeInit('money',     typeof window.initMoney     !== 'undefined' ? window.initMoney     : null);
  safeInit('ai',        typeof window.initAI       !== 'undefined' ? window.initAI       : null);
  safeInit('settings',  typeof window.initSettings  !== 'undefined' ? window.initSettings  : null);
});
