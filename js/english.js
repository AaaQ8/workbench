/* 英语模块:四级备考计划 + 词汇进度 + 真题成绩 + 打卡日记 */
const ENGLISH_KEY = 'pw_english_log';
const CET_TOTAL_WORDS = 4500;

function initEnglish() {
  initJournal();
  initCetPlan();
  initCetVocab();
  initCetScores();
  renderTodayWords();
}

/* ---------------- 打卡日记(原有功能) ---------------- */
function initJournal() {
  const saveBtn = $('#english-save');
  const ta = $('#english-journal');
  if (!saveBtn || !ta) return;

  const saved = Store.get(ENGLISH_KEY, '');
  if (saved) ta.value = saved;

  saveBtn.addEventListener('click', () => {
    const text = ta.value.trim();
    if (!text) {
      alert('请先写点什么再保存~');
      return;
    }
    Store.set(ENGLISH_KEY, text);
    alert('英语打卡已保存!继续加油 💪');
  });
}

/* ---------------- 四级备考计划 ---------------- */
const CET_STAGES = [
  {
    name: '基础期',
    time: '每日',
    tasks: ['背单词 50 个(高频词优先)', '精听真题听力 30 分钟', '每周精读 3 篇阅读文章']
  },
  {
    name: '强化期',
    time: '每日',
    tasks: ['背单词 40 个 + 复习旧词', '听力 40 分钟(跟读模仿)', '阅读 2 篇 + 分项刷真题']
  },
  {
    name: '冲刺期',
    time: '每周',
    tasks: ['完整模考 2 套真题(严格计时)', '背作文模板 + 翻译练习 3 篇', '复习错题本和高频词']
  }
];

function initCetPlan() {
  const dateInput = $('#cet-date');
  const targetInput = $('#cet-target');
  const saveBtn = $('#cet-save');
  if (!dateInput || !saveBtn) return;

  const plan = Store.get(Store.KEYS.CET_PLAN, { date: '2026-12-12', target: 425 });
  dateInput.value = plan.date || '2026-12-12';
  targetInput.value = plan.target || 425;

  saveBtn.addEventListener('click', () => {
    const date = dateInput.value;
    if (!date) {
      alert('请选择考试日期!');
      return;
    }
    Store.set(Store.KEYS.CET_PLAN, { date, target: parseInt(targetInput.value) || 425 });
    renderCetCountdown();
    alert('📅 备考计划已保存!');
  });

  renderCetCountdown();
}

function renderCetCountdown() {
  const plan = Store.get(Store.KEYS.CET_PLAN, { date: '2026-12-12', target: 425 });
  const daysEl = $('#cet-days');
  const targetEl = $('#cet-target-show');
  if (!daysEl) return;
  if (targetEl) targetEl.textContent = plan.target || 425;

  const exam = new Date(plan.date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((exam - today) / 86400000);
  daysEl.textContent = days > 0 ? days : (days === 0 ? '0' : '!');
  daysEl.title = days < 0 ? '考试日期已过,请更新日期' : '';

  // 阶段:考前 90 天以上/60~90 天为基础期,30~60 天强化期,最后 30 天冲刺期
  let cur = 0;
  if (days > 60) cur = 0;
  else if (days > 30) cur = 1;
  else cur = 2;
  if (days < 0) cur = 2;

  for (let i = 0; i < 3; i++) {
    const el = $('#cet-stage-' + i);
    if (!el) continue;
    const active = i === cur;
    el.style.background = active ? 'var(--accent)' : 'var(--bg-hover)';
    el.style.color = active ? '#fff' : 'var(--text-secondary)';
    el.style.fontWeight = active ? '700' : '400';
  }

  const taskBox = $('#cet-stage-task');
  if (taskBox) {
    const st = CET_STAGES[cur];
    taskBox.innerHTML =
      '<div class="plan-item"><span class="plan-time">' + st.name + '</span><span class="plan-desc">' + st.tasks.join(' · ') + '</span></div>';
  }
}

/* ---------------- 今日单词(四级高频词库,按日期轮换) ---------------- */
const CET_WORDS = [
  { en: 'abandon', cn: 'v. 放弃,抛弃', ex: 'Never abandon your dreams.' },
  { en: 'absolute', cn: 'adj. 绝对的,完全的', ex: 'There is no absolute standard.' },
  { en: 'academic', cn: 'adj. 学术的 n. 大学教师', ex: 'His academic performance is excellent.' },
  { en: 'accomplish', cn: 'v. 完成,实现', ex: 'She accomplished the task on time.' },
  { en: 'account', cn: 'n. 账户;描述 v. 解释', ex: 'How do you account for the difference?' },
  { en: 'achieve', cn: 'v. 达到,取得', ex: 'You can achieve your goal step by step.' },
  { en: 'adapt', cn: 'v. 适应,改编', ex: 'Animals adapt to their environment.' },
  { en: 'adequate', cn: 'adj. 足够的,适当的', ex: 'Make sure you get adequate sleep.' },
  { en: 'adjust', cn: 'v. 调整,适应', ex: 'Adjust the chair to a comfortable height.' },
  { en: 'admire', cn: 'v. 钦佩,欣赏', ex: 'I admire her courage.' },
  { en: 'adopt', cn: 'v. 采用,收养', ex: 'The company adopted a new policy.' },
  { en: 'advantage', cn: 'n. 优势,好处', ex: 'Fluency is a big advantage.' },
  { en: 'advocate', cn: 'v. 提倡 n. 拥护者', ex: 'Many experts advocate regular exercise.' },
  { en: 'ambition', cn: 'n. 雄心,抱负', ex: 'Her ambition is to become a dancer.' },
  { en: 'analyze', cn: 'v. 分析', ex: 'Analyze the problem before acting.' },
  { en: 'anniversary', cn: 'n. 周年纪念日', ex: 'Happy wedding anniversary!' },
  { en: 'anxiety', cn: 'n. 焦虑,担忧', ex: 'Exams often cause anxiety.' },
  { en: 'apparent', cn: 'adj. 明显的;表面上的', ex: 'It was apparent that she was tired.' },
  { en: 'appreciate', cn: 'v. 感激;欣赏', ex: 'I would appreciate your help.' },
  { en: 'approach', cn: 'n. 方法 v. 接近', ex: 'We need a new approach.' },
  { en: 'appropriate', cn: 'adj. 恰当的', ex: 'Wear appropriate clothes for dance.' },
  { en: 'artificial', cn: 'adj. 人造的,虚假的', ex: 'Artificial intelligence is developing fast.' },
  { en: 'assemble', cn: 'v. 集合;装配', ex: 'The team assembled at nine.' },
  { en: 'assess', cn: 'v. 评估,评价', ex: 'Teachers assess students regularly.' },
  { en: 'associate', cn: 'v. 联系,交往 n. 同事', ex: 'I associate jazz with freedom.' },
  { en: 'assumption', cn: 'n. 假设,假定', ex: 'Your assumption is wrong.' },
  { en: 'atmosphere', cn: 'n. 大气;气氛', ex: 'The stage atmosphere was electric.' },
  { en: 'attitude', cn: 'n. 态度,看法', ex: 'A positive attitude matters.' },
  { en: 'authority', cn: 'n. 权威;当局', ex: 'She is an authority on law.' },
  { en: 'available', cn: 'adj. 可获得的,有空的', ex: 'Are you available tonight?' },
  { en: 'aware', cn: 'adj. 意识到的', ex: 'Be aware of your posture.' },
  { en: 'balance', cn: 'n. 平衡 v. 权衡', ex: 'Balance work and rest.' },
  { en: 'barrier', cn: 'n. 障碍,屏障', ex: 'Language is not a barrier.' },
  { en: 'behavior', cn: 'n. 行为,举止', ex: 'His behavior surprised us.' },
  { en: 'beneficial', cn: 'adj. 有益的', ex: 'Dancing is beneficial to health.' },
  { en: 'budget', cn: 'n. 预算 v. 编预算', ex: 'Keep within your budget.' },
  { en: 'campaign', cn: 'n. 运动,活动 v. 参加运动', ex: 'They launched a reading campaign.' },
  { en: 'candidate', cn: 'n. 候选人,考生', ex: 'She is a strong candidate.' },
  { en: 'capacity', cn: 'n. 容量;能力', ex: 'The hall has a capacity of 500.' },
  { en: 'challenge', cn: 'n./v. 挑战', ex: 'Learning choreography is a challenge.' },
  { en: 'character', cn: 'n. 性格;角色;字符', ex: 'She has a strong character.' },
  { en: 'collaborate', cn: 'v. 合作,协作', ex: 'The two studios collaborated on the show.' },
  { en: 'commitment', cn: 'n. 承诺,投入', ex: 'Practice requires commitment.' },
  { en: 'community', cn: 'n. 社区,群体', ex: 'The dance community is welcoming.' },
  { en: 'compete', cn: 'v. 竞争,比赛', ex: 'They compete in national contests.' },
  { en: 'concentrate', cn: 'v. 集中,专注', ex: 'Concentrate on the beat.' },
  { en: 'confidence', cn: 'n. 信心,信任', ex: 'Confidence grows with practice.' },
  { en: 'consequence', cn: 'n. 后果,结果', ex: 'Every choice has consequences.' },
  { en: 'contribute', cn: 'v. 贡献,投稿', ex: 'Everyone can contribute ideas.' },
  { en: 'convince', cn: 'v. 说服,使确信', ex: 'He convinced me to join the class.' },
  { en: 'crucial', cn: 'adj. 关键的,决定性的', ex: 'Timing is crucial in dance.' },
  { en: 'cultivate', cn: 'v. 培养,耕作', ex: 'Cultivate a reading habit.' },
  { en: 'curious', cn: 'adj. 好奇的', ex: 'Stay curious about the world.' },
  { en: 'deliberately', cn: 'adv. 故意地;从容地', ex: 'She moved slowly and deliberately.' },
  { en: 'demonstrate', cn: 'v. 证明;演示', ex: 'The coach demonstrated the move.' },
  { en: 'distribute', cn: 'v. 分发,分配', ex: 'Please distribute the handouts.' },
  { en: 'domestic', cn: 'adj. 国内的;家庭的', ex: 'Domestic flights are cheaper.' },
  { en: 'efficient', cn: 'adj. 高效的', ex: 'Efficient practice beats long hours.' },
  { en: 'eliminate', cn: 'v. 消除,淘汰', ex: 'Eliminate distractions while studying.' },
  { en: 'embarrass', cn: 'v. 使尴尬', ex: 'Mistakes used to embarrass her.' },
  { en: 'emergency', cn: 'n. 紧急情况', ex: 'Call 120 in an emergency.' },
  { en: 'emphasize', cn: 'v. 强调', ex: 'The teacher emphasized rhythm.' },
  { en: 'enormous', cn: 'adj. 巨大的', ex: 'The stage has enormous screens.' },
  { en: 'essential', cn: 'adj. 必不可少的', ex: 'Warm-up is essential before dancing.' },
  { en: 'establish', cn: 'v. 建立,确立', ex: 'The school was established in 2010.' },
  { en: 'evaluate', cn: 'v. 评价,估计', ex: 'Evaluate your progress weekly.' },
  { en: 'eventually', cn: 'adv. 最终', ex: 'She eventually got the moves right.' },
  { en: 'evidence', cn: 'n. 证据', ex: 'There is no evidence for that claim.' },
  { en: 'exaggerate', cn: 'v. 夸大,夸张', ex: 'Do not exaggerate the difficulty.' },
  { en: 'exhausted', cn: 'adj. 筋疲力尽的', ex: 'I felt exhausted after rehearsal.' },
  { en: 'expand', cn: 'v. 扩大,扩张', ex: 'Expand your comfort zone.' },
  { en: 'experience', cn: 'n. 经验 v. 经历', ex: 'Experience comes from practice.' },
  { en: 'experiment', cn: 'n. 实验 v. 尝试', ex: 'Experiment with new styles.' },
  { en: 'expert', cn: 'n. 专家 adj. 熟练的', ex: 'Ask an expert for advice.' },
  { en: 'expose', cn: 'v. 暴露,使接触', ex: 'Expose yourself to English daily.' },
  { en: 'facility', cn: 'n. 设施;天赋', ex: 'The studio has great facilities.' },
  { en: 'familiar', cn: 'adj. 熟悉的', ex: 'This song sounds familiar.' },
  { en: 'fascinate', cn: 'v. 使着迷', ex: 'Jazz dance fascinates her.' },
  { en: 'flexible', cn: 'adj. 灵活的;柔韧的', ex: 'Dancers need flexible bodies.' },
  { en: 'focus', cn: 'n. 焦点 v. 集中', ex: 'Focus on your breathing.' },
  { en: 'generate', cn: 'v. 产生,引起', ex: 'The move generated applause.' },
  { en: 'gradually', cn: 'adv. 逐渐地', ex: 'Gradually increase the BPM.' },
  { en: 'guarantee', cn: 'v./n. 保证,担保', ex: 'Practice guarantees improvement.' },
  { en: 'hesitate', cn: 'v. 犹豫', ex: 'Do not hesitate to ask questions.' },
  { en: 'identify', cn: 'v. 识别,确认', ex: 'Identify your weak points.' },
  { en: 'imitate', cn: 'v. 模仿', ex: 'Imitate the teacher in the mirror.' },
  { en: 'impact', cn: 'n. 影响,冲击', ex: 'Music has a huge impact on mood.' },
  { en: 'individual', cn: 'adj. 个人的 n. 个人', ex: 'Every individual learns differently.' },
  { en: 'influence', cn: 'n./v. 影响', ex: 'Her style influenced many dancers.' },
  { en: 'inspire', cn: 'v. 激励,启发', ex: 'Great music inspires creativity.' },
  { en: 'instant', cn: 'adj. 立即的 n. 瞬间', ex: 'The answer was instant.' },
  { en: 'intelligent', cn: 'adj. 聪明的,智能的', ex: 'She is an intelligent learner.' },
  { en: 'interpret', cn: 'v. 口译;解释;演绎', ex: 'Interpret the song your own way.' },
  { en: 'invest', cn: 'v. 投资,投入', ex: 'Invest time in basics.' },
  { en: 'involve', cn: 'v. 涉及,包含', ex: 'The routine involves eight counts.' },
  { en: 'isolated', cn: 'adj. 孤立的,隔离的', ex: 'Isolation drills train body control.' },
  { en: 'justify', cn: 'v. 证明…正当', ex: 'The results justify the effort.' },
  { en: 'launch', cn: 'v. 发起,发射 n. 发布', ex: 'They launched a new course.' },
  { en: 'maintain', cn: 'v. 维持,保养', ex: 'Maintain a daily practice.' },
  { en: 'medium', cn: 'n. 媒介 adj. 中等的', ex: 'Video is a powerful medium.' },
  { en: 'memorize', cn: 'v. 记住,背诵', ex: 'Memorize the choreography.' },
  { en: 'motivate', cn: 'v. 激励', ex: 'Goals motivate you to practice.' },
  { en: 'negotiate', cn: 'v. 谈判,协商', ex: 'They negotiated the rent.' },
  { en: 'obstacle', cn: 'n. 障碍', ex: 'Fear is the biggest obstacle.' },
  { en: 'obtain', cn: 'v. 获得', ex: 'Obtain permission first.' },
  { en: 'occupy', cn: 'v. 占用,占据', ex: 'The studio was occupied.' },
  { en: 'opportunity', cn: 'n. 机会', ex: 'Every show is an opportunity.' },
  { en: 'original', cn: 'adj. 原创的 n. 原作', ex: 'Her choreography is original.' },
  { en: 'overcome', cn: 'v. 克服', ex: 'Overcome stage fright.' },
  { en: 'participate', cn: 'v. 参与', ex: 'Participate in the workshop.' },
  { en: 'perceive', cn: 'v. 感知,认为', ex: 'We perceive rhythm naturally.' },
  { en: 'perform', cn: 'v. 表演,执行', ex: 'She will perform on Friday.' },
  { en: 'potential', cn: 'n. 潜力 adj. 潜在的', ex: 'You have great potential.' },
  { en: 'precise', cn: 'adj. 精确的', ex: 'Precise timing wins competitions.' },
  { en: 'previous', cn: 'adj. 以前的', ex: 'Review the previous lesson.' },
  { en: 'primary', cn: 'adj. 主要的,初级的', ex: 'Safety is our primary concern.' },
  { en: 'principle', cn: 'n. 原则,原理', ex: 'Follow the basic principles.' },
  { en: 'priority', cn: 'n. 优先事项', ex: 'Make practice a priority.' },
  { en: 'profession', cn: 'n. 职业', ex: 'Teaching is a noble profession.' },
  { en: 'prohibit', cn: 'v. 禁止', ex: 'Smoking is prohibited here.' },
  { en: 'promote', cn: 'v. 促进,晋升,推销', ex: 'Exercise promotes health.' },
  { en: 'publish', cn: 'v. 出版,发布', ex: 'Publish your vlog this week.' },
  { en: 'pursue', cn: 'v. 追求,从事', ex: 'Pursue what you love.' },
  { en: 'quality', cn: 'n. 质量;品质', ex: 'Quality matters over quantity.' },
  { en: 'range', cn: 'n. 范围 v. 变动', ex: 'Her vocal range is wide.' },
  { en: 'recognize', cn: 'v. 认出,承认', ex: 'I recognized the melody at once.' },
  { en: 'reflect', cn: 'v. 反思;反映', ex: 'Reflect on your performance.' },
  { en: 'relevant', cn: 'adj. 相关的', ex: 'Keep your notes relevant.' },
  { en: 'reliable', cn: 'adj. 可靠的', ex: 'She is a reliable partner.' },
  { en: 'remarkable', cn: 'adj. 非凡的', ex: 'Remarkable progress in a month!' },
  { en: 'represent', cn: 'v. 代表,表现', ex: 'Each move represents an emotion.' },
  { en: 'require', cn: 'v. 需要,要求', ex: 'This job requires patience.' },
  { en: 'resource', cn: 'n. 资源', ex: 'Use online resources wisely.' },
  { en: 'respond', cn: 'v. 回应,反应', ex: 'Respond quickly to the beat.' },
  { en: 'responsible', cn: 'adj. 负责的', ex: 'Be responsible for your growth.' },
  { en: 'reveal', cn: 'v. 揭示,展现', ex: 'The video revealed her talent.' },
  { en: 'rhythm', cn: 'n. 节奏,韵律', ex: 'Feel the rhythm of the music.' },
  { en: 'routine', cn: 'n. 常规;成套动作', ex: 'My morning routine includes stretching.' },
  { en: 'schedule', cn: 'n. 计划表 v. 安排', ex: 'Check your practice schedule.' },
  { en: 'strategy', cn: 'n. 策略', ex: 'A good strategy saves time.' },
  { en: 'stretch', cn: 'v. 拉伸,伸展 n. 一段', ex: 'Stretch before every session.' },
  { en: 'sufficient', cn: 'adj. 充分的', ex: 'Two hours is sufficient.' },
  { en: 'surroundings', cn: 'n. 周围环境', ex: 'Be aware of your surroundings.' },
  { en: 'sustain', cn: 'v. 维持,持续', ex: 'Sustain the effort for 30 days.' },
  { en: 'technique', cn: 'n. 技巧,技术', ex: 'Her technique is flawless.' },
  { en: 'temporary', cn: 'adj. 暂时的', ex: 'Setbacks are temporary.' },
  { en: 'tend', cn: 'v. 倾向,照料', ex: 'Beginners tend to rush the beat.' },
  { en: 'tremendous', cn: 'adj. 极大的', ex: 'Tremendous energy on stage!' },
  { en: 'typical', cn: 'adj. 典型的', ex: 'A typical jazz class lasts 90 minutes.' },
  { en: 'unique', cn: 'adj. 独特的', ex: 'Your style is unique.' },
  { en: 'urgent', cn: 'adj. 紧急的', ex: 'Nothing is urgent during practice.' },
  { en: 'variety', cn: 'n. 多样,种类', ex: 'Add variety to your training.' },
  { en: 'volunteer', cn: 'n. 志愿者 v. 自愿做', ex: 'She volunteers at the studio.' }
];

function renderTodayWords() {
  const box = $('#word-list');
  if (!box) return;
  // 按一年中的第几天轮换,每天 3 个不重复的词
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  const perDay = 3;
  const base = (dayOfYear * perDay) % CET_WORDS.length;
  box.innerHTML = '';
  for (let i = 0; i < perDay; i++) {
    const w = CET_WORDS[(base + i) % CET_WORDS.length];
    const div = document.createElement('div');
    div.className = 'word-item';
    div.innerHTML =
      '<div class="word-en"><span class="speak-btn" data-text="' + escapeHtml(w.en) + '">🔊</span> ' + escapeHtml(w.en) + '</div>' +
      '<div class="word-cn">' + escapeHtml(w.cn) + '</div>' +
      '<div class="word-example"><span class="speak-btn small" data-text="' + escapeHtml(w.ex) + '">🔊</span> ' + escapeHtml(w.ex) + '</div>';
    box.appendChild(div);
  }
  // 发音按钮事件委托
  box.querySelectorAll('.speak-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      speakWord(btn.dataset.text);
    });
  });
}

// 发音:优先系统 TTS,失败/不支持时用有道在线发音(国内手机可用)
let _ttsAudio = null;
function speakWord(text) {
  if (!text) return;
  // 尝试系统 TTS
  if ('speechSynthesis' in window) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.9;
      // 兜底:如果 1.5 秒内没开始发声,改用在线 TTS
      let fallbackTimer = setTimeout(() => {
        _speakOnline(text);
      }, 1500);
      u.onstart = () => clearTimeout(fallbackTimer);
      u.onerror = () => { clearTimeout(fallbackTimer); _speakOnline(text); };
      speechSynthesis.speak(u);
      return;
    } catch (e) { /* fallthrough to online */ }
  }
  _speakOnline(text);
}

function _speakOnline(text) {
  try {
    if (_ttsAudio) {
      _ttsAudio.pause();
      _ttsAudio = null;
    }
    // 有道词典发音接口,国内可访问
    const url = 'https://dict.youdao.com/dictvoice?type=2&audio=' + encodeURIComponent(text);
    _ttsAudio = new Audio(url);
    _ttsAudio.play().catch(() => {
      showToast('发音加载失败,请检查网络');
    });
  } catch (e) {
    showToast('当前环境无法发音');
  }
}

/* 打开「不背单词」App */
function openBudouApp() {
  const now = Date.now();
  // Android scheme
  window.location.href = 'budouwords://';
  setTimeout(() => {
    if (Date.now() - now < 2500 && document.visibilityState === 'visible') {
      // 没跳转成功,打开应用商店或网页版
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('iphone') || ua.includes('ipad')) {
        window.location.href = 'https://apps.apple.com/cn/app/id1015043531';
      } else {
        window.location.href = 'https://www.budou.com/';
      }
    }
  }, 2000);
}

/* ---------------- 词汇进度 ---------------- */
function initCetVocab() {
  const input = $('#cet-vocab-input');
  const add = $('#cet-vocab-add');
  const reset = $('#cet-vocab-reset');
  if (!add) return;

  add.addEventListener('click', () => {
    const n = parseInt(input.value);
    if (!n || n <= 0) {
      alert('请输入今天背的单词数!');
      return;
    }
    const d = Store.get(Store.KEYS.CET_VOCAB, { done: 0, log: {} });
    const key = formatDate(Date.now());
    d.done += n;
    d.log[key] = (d.log[key] || 0) + n;
    Store.set(Store.KEYS.CET_VOCAB, d);
    input.value = '';
    renderCetVocab();
  });

  input.addEventListener('keydown', e => { if (e.key === 'Enter') add.click(); });

  reset.addEventListener('click', () => {
    if (!confirm('确定把词汇进度清零吗?')) return;
    Store.set(Store.KEYS.CET_VOCAB, { done: 0, log: {} });
    renderCetVocab();
  });

  renderCetVocab();
}

function renderCetVocab() {
  const d = Store.get(Store.KEYS.CET_VOCAB, { done: 0, log: {} });
  const today = formatDate(Date.now());
  const doneEl = $('#cet-vocab-done');
  if (doneEl) doneEl.textContent = d.done;
  const todayEl = $('#cet-vocab-today');
  if (todayEl) todayEl.textContent = d.log[today] || 0;
  const pct = Math.min(100, Math.round((d.done / CET_TOTAL_WORDS) * 100));
  const bar = $('#cet-vocab-bar');
  if (bar) bar.style.width = pct + '%';
  const pctEl = $('#cet-vocab-pct');
  if (pctEl) pctEl.textContent = pct + '%';
}

/* ---------------- 真题成绩 ---------------- */
let cetScoreChart = null;

function initCetScores() {
  const nameInput = $('#cet-score-name');
  const valInput = $('#cet-score-value');
  const add = $('#cet-score-add');
  const list = $('#cet-score-list');
  if (!add) return;

  add.addEventListener('click', () => {
    const n = parseInt(valInput.value);
    if (!n || n <= 0 || n > 710) {
      alert('请输入有效的总分(0-710)!');
      return;
    }
    const scores = Store.get(Store.KEYS.CET_SCORES, []);
    scores.unshift({
      id: uid(),
      name: nameInput.value.trim() || ('第 ' + (scores.length + 1) + ' 套'),
      score: n,
      date: formatDate(Date.now()),
      createdAt: Date.now()
    });
    Store.set(Store.KEYS.CET_SCORES, scores);
    nameInput.value = '';
    valInput.value = '';
    renderCetScores();
  });

  list.addEventListener('click', e => {
    if (e.target.classList.contains('cet-score-del')) {
      const id = e.target.dataset.id;
      Store.set(Store.KEYS.CET_SCORES, Store.get(Store.KEYS.CET_SCORES, []).filter(s => s.id !== id));
      renderCetScores();
    }
  });

  renderCetScores();
}

function renderCetScores() {
  const scores = Store.get(Store.KEYS.CET_SCORES, []);
  const list = $('#cet-score-list');
  if (list) {
    list.innerHTML = '';
    if (!scores.length) {
      list.innerHTML = '<li style="opacity:.5;padding:8px 4px;">还没记录真题成绩,做完一套就记上吧</li>';
    }
    scores.forEach(s => {
      const li = document.createElement('li');
      li.className = 'note-item';
      li.innerHTML =
        '<div class="note-title">📄 ' + escapeHtml(s.name) + '</div>' +
        '<div class="note-preview" style="color:' + (s.score >= 425 ? 'var(--success)' : 'var(--danger)') + '">' + s.score + ' 分</div>' +
        '<div class="note-date">' + (s.date || '') + ' <button class="btn-ghost small cet-score-del" data-id="' + s.id + '">删除</button></div>';
      list.appendChild(li);
    });
  }
  renderCetScoreChart(scores);
}

function renderCetScoreChart(scores) {
  if (typeof Chart === 'undefined') return;
  const canvas = $('#cet-score-chart');
  if (!canvas) return;
  const css = getComputedStyle(document.documentElement);
  Chart.defaults.color = css.getPropertyValue('--text-secondary').trim() || '#9a9aa6';
  Chart.defaults.borderColor = css.getPropertyValue('--border').trim() || '#2a2a33';
  const accent = css.getPropertyValue('--accent').trim() || '#ff6b35';

  if (cetScoreChart) {
    cetScoreChart.destroy();
    cetScoreChart = null;
  }
  if (!scores.length) {
    canvas.style.display = 'none';
    return;
  }
  canvas.style.display = '';
  const chrono = scores.slice().reverse(); // 旧 → 新
  cetScoreChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: chrono.map(s => s.name),
      datasets: [
        {
          label: '总分',
          data: chrono.map(s => s.score),
          borderColor: accent,
          backgroundColor: 'rgba(255,107,53,.15)',
          tension: 0.3,
          fill: true,
          pointRadius: 3
        },
        {
          label: '425 过级线',
          data: chrono.map(() => 425),
          borderColor: '#4ade80',
          borderDash: [6, 6],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
      scales: { y: { beginAtZero: true, max: 710 } }
    }
  });
}

if (typeof window !== 'undefined') {
  window.initEnglish = initEnglish;
  window.openBudouApp = openBudouApp;
  window.speakWord = speakWord;
}
