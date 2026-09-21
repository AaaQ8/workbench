let _quotaWarned = false;
// 安全:只允许读写本应用前缀的 localStorage 键,防止恶意读写其他站点数据
const _STORE_ALLOWED = new Set();
function _isAllowedKey(key) {
  if (typeof key !== 'string') return false;
  if (_STORE_ALLOWED.size === 0) {
    // 懒加载允许列表(KEYS 的所有值)
    Object.values(Store.KEYS).forEach(k => _STORE_ALLOWED.add(k));
  }
  return _STORE_ALLOWED.has(key) || key.startsWith('pw_');
}

const Store = {
  KEYS: {
    TODOS: 'pw_todos',
    YEAR_GOALS: 'pw_year_goals',
    SHORT_GOALS: 'pw_short_goals',
    FOCUS_TOTAL: 'pw_focus_total',
    FOCUS_TODAY: 'pw_focus_today',
    NOTES: 'pw_notes',
    QUICK_NOTE: 'pw_quick_note',
    COUNTDOWN: 'pw_countdown',
    THEME: 'pw_theme',
    ACHIEVEMENTS: 'pw_achievements',
    TODAY: 'pw_today_date',
    META_DIARY: 'pw_meta_diary',
    FINANCE: 'pw_finance',
    FAVORITES: 'pw_favorites',
    AI_NOTES: 'pw_ai_notes',
    STUDY_PLAN: 'pw_study_plan',
    ENGLISH_LOG: 'pw_english_log',
    EXPRESS_LOG: 'pw_express_log',
    MONEY_IDEAS: 'pw_money_ideas',
    DANCE_LOG: 'pw_dance_log',
    DANCE_VIDEOS: 'pw_dance_videos',
    FOCUS_HISTORY: 'pw_focus_history',
    CET_PLAN: 'pw_cet_plan',
    CET_VOCAB: 'pw_cet_vocab',
    CET_SCORES: 'pw_cet_scores',
    EDIT_PROJECTS: 'pw_edit_projects',
    OUTFIT_WEEK: 'pw_outfit_week',
    WARDROBE: 'pw_wardrobe',
    RESUME: 'pw_resume',
    EXPRESS_RECORDINGS: 'pw_express_recordings',
    BEAUTY_PROFILE: 'pw_beauty_profile',
    BOOKS: 'pw_books',
    PHONE_FILES: 'pw_phone_files',
    TIMETABLE: 'pw_timetable',
    TT_PERIODS: 'pw_tt_periods',
    PLANNER: 'pw_planner_tasks'
  },

  get(key, def) {
    if (!_isAllowedKey(key)) return def;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return def;
      return JSON.parse(raw);
    } catch { return def; }
  },

  set(key, val) {
    if (!_isAllowedKey(key)) return false;
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      // 存储满/隐私模式:只弹一次窗,不再让异常打断页面初始化和各功能
      if (!_quotaWarned) {
        _quotaWarned = true;
        alert('浏览器存储空间已满,保存失败!\n\n解决办法:\n1. 打开「系统设置 → 手机内容导入」,删掉几张已导入的照片(照片最占空间)\n2. 先「导出数据」备份,再清理浏览器其他网站的数据\n3. 清理后刷新页面即可正常使用');
      }
      return false;
    }
  },

  usage() {
    // 粗略估算已用空间(字符数 ≈ 字节,base64 照片占大头)
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        total += (localStorage.getItem(k) || '').length + k.length;
      }
    } catch { return -1; }
    return total;
  },

  dailyReset() {
    const today = new Date().toDateString();
    const last = this.get(this.KEYS.TODAY, '');
    if (last !== today) {
      this.set(this.KEYS.TODAY, today);
      this.set(this.KEYS.FOCUS_TODAY, 0);
    }
  },

  export() {
    const data = {};
    Object.values(this.KEYS).forEach(k => { data[k] = this.get(k); });
    return JSON.stringify(data, null, 2);
  },

  import(json) {
    const data = JSON.parse(json);
    Object.entries(data).forEach(([k, v]) => {
      // 只导入本应用允许的键,防止恶意注入
      if (_isAllowedKey(k) && v !== undefined && v !== null) this.set(k, v);
    });
  },

  clear() {
    // 只清除本应用前缀的键,不影响其他站点
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('pw_')) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  },

  /* IndexedDB 大文件存储:突破 localStorage 5MB 限制,存录音/照片等大数据
     接口异步(get/set/remove 返回 Promise),小数据仍用上面的同步 get/set */
  idb: (function () {
    let dbPromise = null;
    function open() {
      if (dbPromise) return dbPromise;
      dbPromise = new Promise((resolve, reject) => {
        try {
          const req = indexedDB.open('pw_bigstore', 1);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        } catch (e) { reject(e); }
      });
      return dbPromise;
    }
    function tx(mode) {
      return open().then(db => {
        const t = db.transaction('kv', mode);
        return { store: t.objectStore('kv'), done: new Promise((res, rej) => {
          t.oncomplete = () => res(true);
          t.onerror = () => rej(t.error);
          t.onabort = () => rej(t.error);
        })};
      });
    }
    return {
      get(key) {
        return tx('readonly').then(({ store }) => new Promise((res, rej) => {
          const req = store.get(key);
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        }));
      },
      set(key, val) {
        return tx('readwrite').then(({ store, done }) => {
          store.put(val, key);
          return done;
        });
      },
      remove(key) {
        return tx('readwrite').then(({ store, done }) => {
          store.delete(key);
          return done;
        });
      }
    };
  })()
};

/* ---------- 工具函数 ---------- */
function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

/* 防抖:高频事件(输入/滚动/resize)合并为最后一次执行 */
function debounce(fn, wait) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/* 节流:固定时间间隔最多执行一次 */
function throttle(fn, wait) {
  let last = 0, t;
  return function (...args) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    } else {
      clearTimeout(t);
      t = setTimeout(() => { last = Date.now(); fn.apply(this, args); }, wait - (now - last));
    }
  };
}

const $  = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
