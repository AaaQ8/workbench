let _quotaWarned = false;

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
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return def;
      return JSON.parse(raw);
    } catch { return def; }
  },

  set(key, val) {
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
      if (v !== undefined && v !== null) this.set(k, v);
    });
  },

  clear() {
    localStorage.clear();
  }
};

const $  = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
