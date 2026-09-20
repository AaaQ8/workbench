/* 爵士舞练习助手
 * 节拍器采用 Web Audio 前瞻调度(lookahead scheduler),
 * 方案参考 cwilso/metronome (MIT, https://github.com/cwilso/metronome)
 */
function initDance() {
  initMetronome();
  initDanceVideos();
  initDanceLog();
}

/* ---------------- 节拍器 ---------------- */
const metro = {
  playing: false,
  bpm: 100,
  beat: 0,          // 0-7,对应第 1-8 拍
  nextTime: 0,
  timer: null,
  ctx: null
};

function initMetronome() {
  const slider = $('#metro-slider');
  const dots = $('#metro-dots');
  if (!slider || !dots) return;

  // 8 个节拍指示点
  dots.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const d = document.createElement('span');
    d.style.cssText = 'width:18px;height:18px;border-radius:50%;background:var(--bg-hover);border:1px solid var(--border);transition:all .08s;';
    d.dataset.beat = i;
    dots.appendChild(d);
  }

  slider.addEventListener('input', () => setBpm(parseInt(slider.value)));
  $$('.metro-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      setBpm(parseInt(btn.dataset.bpm));
      $('#metro-slider').value = btn.dataset.bpm;
    });
  });

  $('#metro-toggle').addEventListener('click', toggleMetronome);
  setBpm(100);
}

function setBpm(v) {
  metro.bpm = v;
  const el = $('#metro-bpm');
  if (el) el.textContent = v;
}

function toggleMetronome() {
  if (metro.playing) {
    stopMetronome();
  } else {
    startMetronome();
  }
}

function startMetronome() {
  try {
    metro.ctx = metro.ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (metro.ctx.state === 'suspended') metro.ctx.resume();
  } catch (e) {
    alert('音频初始化失败:' + e.message);
    return;
  }
  metro.playing = true;
  metro.beat = 0;
  metro.nextTime = metro.ctx.currentTime + 0.1;
  metro.timer = setInterval(metroScheduler, 25);
  const btn = $('#metro-toggle');
  if (btn) btn.textContent = '⏸ 停止';
}

function stopMetronome() {
  metro.playing = false;
  clearInterval(metro.timer);
  const btn = $('#metro-toggle');
  if (btn) btn.textContent = '▶ 开始';
  const count = $('#metro-count');
  if (count) count.textContent = '已停止,再按一次继续';
  highlightBeat(-1);
}

/* 前瞻调度:每 25ms 检查一次,提前 0.12s 排队音符,节奏不受 UI 卡顿影响 */
function metroScheduler() {
  while (metro.nextTime < metro.ctx.currentTime + 0.12) {
    scheduleMetroBeat(metro.beat, metro.nextTime);
    const showBeat = metro.beat;
    const delay = Math.max(0, (metro.nextTime - metro.ctx.currentTime) * 1000);
    setTimeout(() => highlightBeat(showBeat), delay);
    metro.beat = (metro.beat + 1) % 8;
    metro.nextTime += 60 / metro.bpm;
  }
}

function scheduleMetroBeat(beat, t) {
  const osc = metro.ctx.createOscillator();
  const gain = metro.ctx.createGain();
  // 第 1、5 拍重音(音调更高、更响),爵士 8 拍常用
  osc.frequency.value = beat === 0 ? 1568 : (beat === 4 ? 1175 : 784);
  osc.type = 'sine';
  const vol = beat === 0 ? 0.6 : (beat === 4 ? 0.45 : 0.3);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(gain);
  gain.connect(metro.ctx.destination);
  osc.start(t);
  osc.stop(t + 0.08);
}

function highlightBeat(beat) {
  $$('#metro-dots span').forEach(d => {
    const isCur = parseInt(d.dataset.beat) === beat;
    const accent = parseInt(d.dataset.beat) === 0 || parseInt(d.dataset.beat) === 4;
    d.style.background = isCur ? 'var(--accent)' : 'var(--bg-hover)';
    d.style.transform = isCur ? 'scale(1.4)' : 'scale(1)';
    d.style.borderColor = accent ? 'var(--accent)' : 'var(--border)';
  });
  const count = $('#metro-count');
  if (count && beat >= 0) {
    count.textContent = '第 ' + (beat + 1) + ' 拍' + (beat === 0 || beat === 4 ? ' · 重音!' : '');
  }
}

/* ---------------- 跟练视频收藏 ---------------- */
function parseVideoUrl(url) {
  url = url.trim();
  let m = url.match(/bilibili\.com\/video\/(BV\w+)/i);
  if (m) return { type: 'bilibili', id: m[1], embed: 'https://player.bilibili.com/player.html?bvid=' + m[1] + '&autoplay=0&high_quality=1' };
  m = url.match(/youtube\.com\/watch\?v=([\w-]+)/i) || url.match(/youtu\.be\/([\w-]+)/i);
  if (m) return { type: 'youtube', id: m[1], embed: 'https://www.youtube-nocookie.com/embed/' + m[1] };
  return null;
}

function initDanceVideos() {
  const input = $('#dance-video-url');
  const addBtn = $('#dance-video-add');
  const list = $('#dance-video-list');
  const frame = $('#dance-video-frame');
  const playerBox = $('#dance-video-player');
  if (!input || !addBtn || !list) return;

  function render(currentId) {
    const videos = Store.get(Store.KEYS.DANCE_VIDEOS, []);
    list.innerHTML = '';
    if (!videos.length) {
      list.innerHTML = '<li style="opacity:.5;padding:8px 4px;">还没有收藏视频,粘贴上面的链接添加吧</li>';
      return;
    }
    videos.forEach(v => {
      const li = document.createElement('li');
      li.className = 'note-item';
      li.style.cursor = 'pointer';
      const icon = v.type === 'bilibili' ? '📺' : '▶️';
      li.innerHTML =
        '<div class="note-title">' + icon + ' ' + escapeHtml(v.title || v.embedId) + '</div>' +
        '<div class="note-date"><button class="btn-ghost small dance-video-del" data-id="' + v.id + '">删除</button></div>';
      li.addEventListener('click', e => {
        if (e.target.classList.contains('dance-video-del')) return;
        playVideo(v.embed);
      });
      list.appendChild(li);
    });
  }

  function playVideo(embedUrl) {
    if (!frame || !playerBox) return;
    frame.src = embedUrl;
    playerBox.style.display = 'block';
    playerBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function addVideo() {
    const url = input.value.trim();
    if (!url) return;
    const parsed = parseVideoUrl(url);
    if (!parsed) {
      alert('没能识别视频链接,请粘贴 bilibili.com/video/BV... 或 YouTube 链接');
      return;
    }
    const videos = Store.get(Store.KEYS.DANCE_VIDEOS, []);
    if (videos.some(v => v.embedId === parsed.id)) {
      alert('这个视频已经在收藏里啦');
      return;
    }
    videos.unshift({
      id: uid(),
      type: parsed.type,
      embedId: parsed.id,
      title: prompt('给这个视频起个名字(可留空):', '') || parsed.id,
      url: parsed.embed,
      createdAt: Date.now()
    });
    Store.set(Store.KEYS.DANCE_VIDEOS, videos);
    input.value = '';
    render();
    playVideo(parsed.embed);
  }

  addBtn.addEventListener('click', addVideo);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addVideo(); });
  list.addEventListener('click', e => {
    if (e.target.classList.contains('dance-video-del')) {
      e.stopPropagation();
      const id = e.target.dataset.id;
      Store.set(Store.KEYS.DANCE_VIDEOS, Store.get(Store.KEYS.DANCE_VIDEOS, []).filter(v => v.id !== id));
      render();
    }
  });

  render();
}

/* ---------------- 练习打卡 ---------------- */
function danceStats(dates) {
  const set = new Set(dates);
  const dayMs = 86400000;
  // 连续天数:从今天(或昨天)往回数
  let streak = 0;
  let cur = new Date();
  if (!set.has(formatDate(cur.getTime()))) cur.setTime(cur.getTime() - dayMs);
  while (set.has(formatDate(cur.getTime()))) {
    streak++;
    cur.setTime(cur.getTime() - dayMs);
  }
  // 本周次数(周一为一周开始)
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const week = dates.filter(d => new Date(d + 'T00:00:00') >= monday).length;
  return { streak, week, total: dates.length };
}

function initDanceLog() {
  const btn = $('#dance-checkin');
  const list = $('#dance-log-list');
  if (!btn || !list) return;

  function render() {
    const logs = Store.get(Store.KEYS.DANCE_LOG, []);
    const dates = logs.map(l => l.date);
    const s = danceStats(dates);
    const el = id => $('#' + id);
    if (el('dance-streak')) el('dance-streak').textContent = s.streak;
    if (el('dance-week')) el('dance-week').textContent = s.week;
    if (el('dance-total')) el('dance-total').textContent = s.total;

    const today = formatDate(Date.now());
    btn.textContent = dates.includes(today) ? '✅ 今日已打卡' : '💪 今日练习打卡';
    btn.disabled = dates.includes(today);

    list.innerHTML = '';
    logs.slice(0, 10).forEach(l => {
      const li = document.createElement('li');
      li.className = 'note-item';
      li.innerHTML =
        '<div class="note-title">💃 ' + l.date + (l.note ? ' · ' + escapeHtml(l.note) : '') + '</div>' +
        '<div class="note-date"><button class="btn-ghost small dance-log-del" data-id="' + l.id + '">删除</button></div>';
      list.appendChild(li);
    });
    if (!logs.length) {
      list.innerHTML = '<li style="opacity:.5;padding:8px 4px;">今天练完记得打卡,坚持出效果!</li>';
    }
  }

  btn.addEventListener('click', () => {
    const logs = Store.get(Store.KEYS.DANCE_LOG, []);
    const note = prompt('今天练了什么?简单记一句(可留空):', '') || '';
    logs.unshift({ id: uid(), date: formatDate(Date.now()), note, ts: Date.now() });
    Store.set(Store.KEYS.DANCE_LOG, logs);
    render();
  });

  list.addEventListener('click', e => {
    if (e.target.classList.contains('dance-log-del')) {
      const id = e.target.dataset.id;
      Store.set(Store.KEYS.DANCE_LOG, Store.get(Store.KEYS.DANCE_LOG, []).filter(l => l.id !== id));
      render();
    }
  });

  render();
}

if (typeof window !== 'undefined') window.initDance = initDance;
