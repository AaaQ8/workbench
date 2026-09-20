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
    BEAUTY_PROFILE: 'pw_beauty_profile',
    BOOKS: 'pw_books'
  },

  get(key, def) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return def;
      return JSON.parse(raw);
    } catch { return def; }
  },

  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
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
