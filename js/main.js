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

function _cdFmt(ms) {
  const abs = Math.abs(ms);
  const total = Math.floor(abs / 1000);
  return {
    days:  String(Math.floor(total / 86400)).padStart(2, '0'),
    hours: String(Math.floor((total % 86400) / 3600)).padStart(2, '0'),
    min:   String(Math.floor((total % 3600) / 60)).padStart(2, '0'),
    sec:   String(total % 60).padStart(2, '0')
  };
}

function _cdMigrate() {
  let cur = Store.get(Store.KEYS.COUNTDOWN, []);
  if (Array.isArray(cur)) return cur;
  // 兼容旧格式 { name, date }
  if (cur && cur.name && cur.date) {
    const arr = [{ id: uid(), name: cur.name, date: cur.date, createdAt: Date.now() }];
    Store.set(Store.KEYS.COUNTDOWN, arr);
    return arr;
  }
  Store.set(Store.KEYS.COUNTDOWN, []);
  return [];
}

function _cdRenderList() {
  const container = $('#cd-list');
  const emptyMsg = $('#cd-empty');
  if (!container) return;
  const arr = _cdMigrate();
  if (!arr.length) {
    container.innerHTML = '';
    if (emptyMsg) emptyMsg.style.display = '';
    return;
  }
  if (emptyMsg) emptyMsg.style.display = 'none';
  const now = Date.now();
  // 即将到来按日期升序,过期按日期降序
  const upcoming = arr.filter(c => new Date(c.date).getTime() >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = arr.filter(c => new Date(c.date).getTime() < now).sort((a, b) => new Date(b.date) - new Date(a.date));
  const ordered = [...upcoming, ...past];
  container.innerHTML = '';
  ordered.forEach(c => {
    const card = document.createElement('div');
    card.className = 'cd-card';
    card.dataset.id = c.id;
    const targetTs = new Date(c.date).getTime();
    const dateStr = new Date(c.date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    card.innerHTML = `
      <div class="cd-card-top">
        <span class="cd-card-name">${escapeHtml(c.name)}</span>
        <button class="cd-del" data-id="${c.id}" title="删除">✕</button>
      </div>
      <div class="cd-card-body">
        <div class="cd-days-block">
          <span class="cd-days-num" data-target="${targetTs}">00</span>
          <span class="cd-days-label">天</span>
        </div>
        <div class="cd-hms">
          <span class="cd-hms-num" data-cd-hms="h">00</span><span class="cd-hms-sep">:</span><span class="cd-hms-num" data-cd-hms="m">00</span><span class="cd-hms-sep">:</span><span class="cd-hms-num" data-cd-hms="s">00</span>
        </div>
      </div>
      <div class="cd-card-date">${new Date(c.date).getTime() < now ? '已过 ' : ''}${dateStr}</div>
    `;
    container.appendChild(card);
  });
}

function _cdRenderManageList() {
  const ul = $('#cd-manage-list');
  if (!ul) return;
  const arr = _cdMigrate();
  ul.innerHTML = '';
  if (!arr.length) {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.textContent = '还没有倒数日,在上方添加一个吧~';
    ul.appendChild(li);
    return;
  }
  // 按日期升序排列
  const sorted = [...arr].sort((a, b) => new Date(a.date) - new Date(b.date));
  sorted.forEach(c => {
    const li = document.createElement('li');
    li.className = 'note-item cd-manage-item';
    const dateStr = new Date(c.date).toLocaleDateString('zh-CN');
    li.innerHTML = `<span>${escapeHtml(c.name)} · ${dateStr}</span><button class="fav-delete" data-id="${c.id}" title="删除">✕</button>`;
    li.querySelector('button').addEventListener('click', () => {
      if (confirm(`删除倒数日「${c.name}」?`)) {
        const cur = _cdMigrate().filter(x => x.id !== c.id);
        Store.set(Store.KEYS.COUNTDOWN, cur);
        _cdRenderList();
        _cdRenderManageList();
        showToast('已删除');
      }
    });
    ul.appendChild(li);
  });
}

function startCountdown() {
  const container = $('#cd-list');
  if (!container) return;
  _cdMigrate();
  _cdRenderList();
  _cdRenderManageList();

  const _cdNotified = new Set();
  // 每秒刷新所有卡片
  function tick() {
    const now = Date.now();
    $$('#cd-list .cd-card').forEach(card => {
      const daysEl = card.querySelector('.cd-days-num');
      if (!daysEl) return;
      const target = parseInt(daysEl.dataset.target, 10);
      const diff = target - now;
      const past = diff < 0;
      const f = _cdFmt(diff);
      daysEl.textContent = f.days;
      const spans = card.querySelectorAll('[data-cd-hms]');
      if (spans.length === 3) {
        spans[0].textContent = f.hours;
        spans[1].textContent = f.min;
        spans[2].textContent = f.sec;
      }
      card.classList.toggle('cd-past', past);
      // 倒数日到点(进入 0 或负数)弹一次通知
      const id = card.dataset.id;
      if (past && id && !_cdNotified.has(id)) {
        _cdNotified.add(id);
        const name = (card.querySelector('.cd-card-name') || {}).textContent || '目标';
        if (typeof Notify !== 'undefined') {
          Notify.push('🎯 倒数日到了', { body: `「${name}」的日子到啦!`, tag: 'cd-' + id });
        }
      }
    });
  }
  tick();
  setInterval(tick, 1000);

  // 卡片上的删除按钮(事件委托)
  container.addEventListener('click', e => {
    const btn = e.target.closest('.cd-del');
    if (!btn) return;
    const id = btn.dataset.id;
    const arr = _cdMigrate();
    const target = arr.find(x => x.id === id);
    if (target && confirm(`删除倒数日「${target.name}」?`)) {
      Store.set(Store.KEYS.COUNTDOWN, arr.filter(x => x.id !== id));
      _cdRenderList();
      _cdRenderManageList();
    }
  });

  // 设置面板的添加按钮
  const saveBtn = $('#save-countdown');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const nameEl = $('#set-cd-name');
      const dateEl = $('#set-cd-date');
      const name = nameEl ? nameEl.value.trim() : '';
      const date = dateEl ? dateEl.value : '';
      if (!name) { alert('先填目标名称~'); return; }
      if (!date) { alert('选个目标日期时间~'); return; }
      const arr = _cdMigrate();
      arr.push({ id: uid(), name, date: new Date(date).toISOString(), createdAt: Date.now() });
      if (!Store.set(Store.KEYS.COUNTDOWN, arr)) return;
      if (nameEl) nameEl.value = '';
      if (dateEl) dateEl.value = '';
      _cdRenderList();
      _cdRenderManageList();
      showToast('✅ 已添加倒数日');
    });
  }
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
      try { sessionStorage.setItem('pw_active_panel', panelId); } catch (e) {}
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
    // 防抖:输入停止 400ms 后才保存,避免每按键都写 localStorage
    const saveDebounced = debounce(() => Store.set(Store.KEYS.QUICK_NOTE, ta.value), 400);
    ta.addEventListener('input', saveDebounced);
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

// 移动端外链优先跳转 App,失败再开网页
const APP_SCHEME_MAP = {
  'bilibili.com': 'bilibili://',
  'douyin.com': 'snssdk1128://',
  'zhihu.com': 'zhihu://',
  'xiaohongshu.com': 'xhsdiscover://',
  'weibo.com': 'weibo://',
  'youtube.com': 'vnd.youtube://',
  'youtu.be': 'vnd.youtube://',
  'github.com': 'github://'
};
function _matchAppScheme(href) {
  const lower = (href || '').toLowerCase();
  for (const domain in APP_SCHEME_MAP) {
    if (lower.includes(domain)) return APP_SCHEME_MAP[domain];
  }
  return null;
}

document.addEventListener('click', e => {
  const a = e.target.closest('a[target="_blank"]');
  if (!a) return;
  const href = a.href;
  const scheme = _matchAppScheme(href);
  if (!scheme) return;
  // 仅移动端尝试 App 跳转
  if (!/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
  e.preventDefault();
  const start = Date.now();
  const fallback = setTimeout(() => {
    if (Date.now() - start < 2500) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }, 1800);
  const onHide = () => {
    clearTimeout(fallback);
    document.removeEventListener('visibilitychange', onHide);
  };
  document.addEventListener('visibilitychange', onHide);
  try { location.href = scheme; } catch (err) {
    clearTimeout(fallback);
    window.open(href, '_blank', 'noopener,noreferrer');
  }
});

// 注册 Service Worker(让 PWA 支持后台通知 + 离线)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    if (typeof Notify !== 'undefined') Notify._swReg = reg;
  }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
  Store.dailyReset();
  updateClock();
  setInterval(updateClock, 1000);
  initTabs();

  // 恢复上次所在模块(点外链/切后台回来若被刷新,可回到原位置)
  try {
    const lastPanel = sessionStorage.getItem('pw_active_panel');
    if (lastPanel) {
      const panel = document.getElementById(lastPanel);
      const navName = lastPanel.replace('panel-', '');
      const navItem = document.querySelector(`.nav-item[data-panel="${navName}"]`);
      if (panel && navItem) {
        $$('.nav-item').forEach(t => t.classList.remove('active'));
        $$('.tab-panel').forEach(p => p.classList.remove('active'));
        navItem.classList.add('active');
        panel.classList.add('active');
      }
    }
  } catch (e) {}

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
  safeInit('makeupFavs',typeof window.initMakeupFavs!== 'undefined' ? window.initMakeupFavs: null);
  safeInit('finance',   typeof window.initFinance   !== 'undefined' ? window.initFinance   : null);
  safeInit('news',      typeof window.initNews      !== 'undefined' ? window.initNews      : null);
  safeInit('podcast',   typeof window.initPodcast   !== 'undefined' ? window.initPodcast   : null);
  safeInit('aistudy',   typeof window.initAistudy   !== 'undefined' ? window.initAistudy   : null);
  safeInit('favorites', typeof window.initFavorites !== 'undefined' ? window.initFavorites : null);
  safeInit('edit',      typeof window.initEdit      !== 'undefined' ? window.initEdit      : null);
  safeInit('recommend', typeof window.initRecommend !== 'undefined' ? window.initRecommend : null);
  safeInit('resume',    typeof window.initResume    !== 'undefined' ? window.initResume    : null);
  safeInit('wardrobe',  typeof window.initWardrobe  !== 'undefined' ? window.initWardrobe  : null);
  safeInit('expressRec',typeof window.initExpressRec !== 'undefined' ? window.initExpressRec : null);
  safeInit('focus',     typeof window.initFocus     !== 'undefined' ? window.initFocus     : null);
  safeInit('noise',     typeof window.initNoise     !== 'undefined' ? window.initNoise     : null);
  safeInit('money',     typeof window.initMoney     !== 'undefined' ? window.initMoney     : null);
  safeInit('ai',        typeof window.initAI       !== 'undefined' ? window.initAI       : null);
  safeInit('settings',  typeof window.initSettings  !== 'undefined' ? window.initSettings  : null);

  // 恢复滚动位置(点外链回来若被刷新,回到原滚动处)
  try {
    const lastScroll = parseInt(sessionStorage.getItem('pw_last_scroll'), 10);
    if (lastScroll > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => window.scrollTo(0, lastScroll));
      });
    }
  } catch (e) {}

  // 离开页面时保存滚动位置
  let _scrollTimer = null;
  window.addEventListener('scroll', () => {
    if (_scrollTimer) return;
    _scrollTimer = setTimeout(() => {
      _scrollTimer = null;
      try { sessionStorage.setItem('pw_last_scroll', String(window.scrollY || 0)); } catch (e) {}
    }, 200);
  }, { passive: true });
  window.addEventListener('pagehide', () => {
    try { sessionStorage.setItem('pw_last_scroll', String(window.scrollY || 0)); } catch (e) {}
  });
});
