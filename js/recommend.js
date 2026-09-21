/* 推荐内容每日轮换:基于当天日期+种子做洗牌,每天不一样
 * 覆盖:唱歌 待练歌曲 / 表达 题目 / 法律 小课堂+学习法规 / 学习 正在读的书 / 播客 订阅
 * 养生(wellness.js)已自己轮换,不在此处理
 */

/* ---------- 工具:种子洗牌 + 每日取 N 个 ---------- */
function _recDayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function _recSeedShuffle(arr, seed) {
  const a = arr.slice();
  let s = (seed >>> 0) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    // 线性同余生成器(LCG)
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function _recPick(pool, count, seedOffset) {
  if (!Array.isArray(pool) || !pool.length) return [];
  const seed = _recDayIndex() * 31 + (seedOffset || 0) + 7;
  return _recSeedShuffle(pool, seed).slice(0, Math.min(count, pool.length));
}

function _recItemHtml(icon, item) {
  const url = item.url || 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(item.title);
  const tags = (item.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  return `<a class="media-item" href="${url}" target="_blank" rel="noopener">${icon} ${escapeHtml(item.title)} ${tags}</a>`;
}

function _recRender(containerId, html) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = html;
}

/* ---------- 内容池 ---------- */
const SING_POOL = [
  { title: '王菲 - 如愿',          tags: ['抒情', '高难度'] },
  { title: '陈奕迅 - 浮夸',        tags: ['粤语', '技巧'] },
  { title: '邓紫棋 - 光年之外',    tags: ['流行'] },
  { title: '周深 - 大鱼',          tags: ['空灵'] },
  { title: '林俊杰 - 江南',        tags: ['经典'] },
  { title: '周杰伦 - 晴天',        tags: ['青春'] },
  { title: '邓丽君 - 月亮代表我的心', tags: ['经典'] },
  { title: '薛之谦 - 演员',        tags: ['流行'] },
  { title: '张学友 - 吻别',        tags: ['经典'] },
  { title: '张靓颖 - 画心',        tags: ['难度'] },
  { title: '五月天 - 倔强',        tags: ['摇滚'] },
  { title: '韩红 - 天路',          tags: ['高难度'] }
];

const EXPRESS_POOL = [
  { text: '用 1 分钟介绍你最近最喜欢的一部电影,说出为什么推荐' },
  { text: '即兴演讲:假设你要向朋友推荐一款产品,你会怎么说?' },
  { text: '结构化表达:用「问题-方案-收益」结构说清一个观点' },
  { text: '描述你最难忘的一次旅行,让别人也想去' },
  { text: '你心目中的英雄是谁?为什么?' },
  { text: '谈谈你对失败的理解,讲一个亲身经历' },
  { text: '用 1 分钟说服朋友尝试你最爱的一项运动或爱好' },
  { text: '用通俗语言解释一个你专业的术语,让外行听懂' },
  { text: '描述你最近学到的一项新技能,讲讲过程' },
  { text: '如果可以时光旅行,你想去哪个时代?为什么?' },
  { text: '说说你最感激的一个人,以及为什么' },
  { text: '用结构化方式介绍你的家乡,让人想去旅游' }
];

const LAW_ARTICLE_POOL = [
  {
    title: '📌 租房必知的 5 个法律常识',
    body: '1. 合同期限不超过 20 年,超过无效<br/>2. 租赁期内房屋买卖不影响租赁合同<br/>3. 出租人维修义务的例外<br/>4. 押金退还的时间限制<br/>5. 转租需经出租人书面同意'
  },
  {
    title: '📌 网购维权 4 步法',
    body: '1. 先与商家协商,留存聊天记录<br/>2. 平台介入:申请客服仲裁<br/>3. 拨打 12315 投诉举报<br/>4. 必要时起诉,小额诉讼程序很快'
  },
  {
    title: '📌 劳动合同 5 个关键条款',
    body: '1. 合同类型与期限(无固定期限触发条件)<br/>2. 试用期长度与工资下限(转正 80%)<br/>3. 工作内容与岗位地点<br/>4. 工资支付时间与方式<br/>5. 社保公积金缴纳义务'
  },
  {
    title: '📌 借条必写的 6 个要素',
    body: '1. 借款人姓名 + 身份证号<br/>2. 借款金额大小写<br/>3. 借款期限与利息约定<br/>4. 转账方式备注「借款」<br/>5. 还款日期与违约责任<br/>6. 借款人亲笔签名 + 日期'
  },
  {
    title: '📌 个人信息泄露 4 步维权',
    body: '1. 截图保留证据:来源、内容、时间<br/>2. 向平台投诉要求删除<br/>3. 向网信办举报 12377<br/>4. 造成损失的可起诉索赔'
  },
  {
    title: '📌 交通事故处理流程',
    body: '1. 立即停车、保护现场、报警 122<br/>2. 伤员优先拨打 120<br/>3. 拍照取证:车牌、碰撞点、全景<br/>4. 等交警出具事故认定书<br/>5. 凭认定书走保险理赔'
  },
  {
    title: '📌 消费者 7 天无理由退货范围',
    body: '1. 网购商品默认 7 天无理由(不含定制、生鲜)<br/>2. 商品完好不影响二次销售<br/>3. 退货运费谁承担看约定<br/>4. 商家拒退可向 12315 投诉'
  },
  {
    title: '📌 婚前/婚后财产怎么分',
    body: '1. 婚前个人财产不因结婚转化为共同<br/>2. 婚后所得原则上为共同财产<br/>3. 父母出资买房看登记在哪方名下<br/>4. 协议离婚可约定财产分割,公证更稳'
  }
];

const LAW_STUDY_POOL = [
  { title: '《民法典》合同编',         tags: ['重点'] },
  { title: '《劳动合同法》',           tags: ['职场'] },
  { title: '《消费者权益保护法》',     tags: ['日常'] },
  { title: '《个人信息保护法》',       tags: ['隐私'] },
  { title: '《民法典》婚姻家庭编',    tags: ['家庭'] },
  { title: '《民法典》侵权责任编',     tags: ['赔偿'] },
  { title: '《公司法》',               tags: ['商业'] },
  { title: '《知识产权法》',           tags: ['创新'] }
];

const STUDY_BOOK_POOL = [
  { title: '《原子习惯》 James Clear',        tags: ['自我成长'] },
  { title: '《思考,快与慢》 卡尼曼',         tags: ['心理学'] },
  { title: '《原则》 瑞·达利欧',              tags: ['商业'] },
  { title: '《心流》 契克森米哈赖',           tags: ['专注'] },
  { title: '《刻意练习》 艾利克森',           tags: ['技能'] },
  { title: '《异类》 格拉德威尔',             tags: ['社会'] },
  { title: '《反脆弱》 塔勒布',               tags: ['思维'] },
  { title: '《第五项修炼》 彼得·圣吉',         tags: ['管理'] },
  { title: '《终身成长》 德韦克',              tags: ['心态'] },
  { title: '《穷查理宝典》 查理·芒格',         tags: ['投资'] }
];

const PODCAST_POOL = [
  { title: '忽左忽右',   tags: ['人文'] },
  { title: '商业就是这样', tags: ['商业'] },
  { title: '声东击西',   tags: ['科技'] },
  { title: '随机波动',   tags: ['社会'] },
  { title: '知行小酒馆', tags: ['生活'] },
  { title: '大内密谈',   tags: ['文化'] },
  { title: '跑火车',     tags: ['脱口秀'] },
  { title: '梁文道·八分', tags: ['人文'] },
  { title: '故事FM',     tags: ['纪实'] },
  { title: '大力史话',   tags: ['历史'] }
];

/* 穿搭技巧视频池(t5) */
const OUTFIT_TIP_POOL = [
  { title: '小个子显高穿搭技巧',     tags: ['显高'] },
  { title: '梨形身材穿搭攻略',       tags: ['梨形'] },
  { title: '通勤通勤风穿搭公式',     tags: ['通勤'] },
  { title: '颜色搭配 3 大法则',      tags: ['配色'] },
  { title: '微胖女孩显瘦穿搭',       tags: ['显瘦'] },
  { title: '基础款百搭公式',         tags: ['基础'] },
  { title: '一衣多穿 5 套搭配',      tags: ['实用'] },
  { title: '秋冬叠穿不显胖',         tags: ['叠穿'] },
  { title: '韩系温柔风搭配',         tags: ['韩系'] },
  { title: '通勤包必备单品',         tags: ['通勤'] }
];

/* 唱歌跟练视频池(t9) */
const SING_PRACTICE_POOL = [
  { title: '气息练习 5 分钟跟练',     tags: ['气息'] },
  { title: '开嗓哼鸣 5 分钟',         tags: ['开嗓'] },
  { title: '音阶琶音 10 分钟',       tags: ['音阶'] },
  { title: '颤音技巧跟练',           tags: ['颤音'] },
  { title: '高音突破练习',           tags: ['高音'] },
  { title: '咬字吐字矫正',           tags: ['咬字'] },
  { title: '腹式呼吸 10 分钟',       tags: ['呼吸'] },
  { title: '转音技巧跟练',           tags: ['转音'] },
  { title: '混声过渡练习',           tags: ['混声'] },
  { title: '节奏感训练',             tags: ['节奏'] }
];

/* ---------- 渲染 ---------- */
function initRecommend() {
  const today = new Date();
  const dateStr = `${today.getMonth() + 1} 月 ${today.getDate()} 日`;

  // 唱歌 待练歌曲
  _recRender('rec-sing-songs',
    _recPick(SING_POOL, 4, 1).map(i => _recItemHtml('🎵', { ...i, url: 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(i.title) })).join('')
    + `<p class="smart-tip">📅 ${dateStr} · 每日更新,共 ${SING_POOL.length} 首候选</p>`
  );

  // 表达 题目
  _recRender('rec-express-prompts',
    _recPick(EXPRESS_POOL, 3, 2).map((p, i) => `
      <div class="prompt-item">
        <div class="prompt-q">今日话题 #${i + 1}</div>
        <div class="prompt-text">${escapeHtml(p.text)}</div>
      </div>`).join('')
    + `<p class="smart-tip">📅 ${dateStr} · 每日 3 题,共 ${EXPRESS_POOL.length} 题候选</p>`
  );

  // 法律 小课堂
  _recRender('rec-law-article',
    (() => {
      const a = _recPick(LAW_ARTICLE_POOL, 1, 3)[0] || LAW_ARTICLE_POOL[0];
      return `<div class="law-article">
        <div class="law-title">${escapeHtml(a.title)}</div>
        <div class="law-content">${a.body}</div>
      </div>
      <p class="smart-tip">📅 ${dateStr} · 每天 1 条,共 ${LAW_ARTICLE_POOL.length} 条候选</p>`;
    })()
  );

  // 法律 学习法规
  _recRender('rec-law-study',
    _recPick(LAW_STUDY_POOL, 4, 4).map(i => _recItemHtml('📖', { ...i, url: 'https://baike.baidu.com/item/' + encodeURIComponent(i.title.replace(/[《》]/g, '')) })).join('')
    + `<p class="smart-tip">📅 ${dateStr} · 每天 4 部,共 ${LAW_STUDY_POOL.length} 部候选</p>`
  );

  // 学习 正在读的书
  _recRender('rec-study-books',
    _recPick(STUDY_BOOK_POOL, 3, 5).map(i => _recItemHtml('📖', { ...i, url: 'https://www.douban.com/search?cat=1001&q=' + encodeURIComponent(i.title.replace(/[《》]/g, '')) })).join('')
    + `<p class="smart-tip">📅 ${dateStr} · 每天 3 本,共 ${STUDY_BOOK_POOL.length} 本候选</p>`
  );

  // 播客 订阅
  _recRender('rec-podcast-subs',
    _recPick(PODCAST_POOL, 4, 6).map(i => _recItemHtml('🎧', { ...i, url: 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(i.title) })).join('')
    + `<p class="smart-tip">📅 ${dateStr} · 每天 4 档,共 ${PODCAST_POOL.length} 档候选</p>`
  );

  // 穿搭技巧视频
  _recRender('rec-outfit-tips',
    _recPick(OUTFIT_TIP_POOL, 4, 7).map(i => _recItemHtml('👗', { ...i, url: 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(i.title) })).join('')
    + `<p class="smart-tip">📅 ${dateStr} · 每天 4 条,共 ${OUTFIT_TIP_POOL.length} 条候选</p>`
  );

  // 唱歌跟练
  _recRender('rec-sing-practice',
    _recPick(SING_PRACTICE_POOL, 4, 8).map(i => _recItemHtml('🎤', { ...i, url: 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(i.title) })).join('')
    + `<p class="smart-tip">📅 ${dateStr} · 每天 4 条,共 ${SING_PRACTICE_POOL.length} 条候选</p>`
  );
}

if (typeof window !== 'undefined') window.initRecommend = initRecommend;
