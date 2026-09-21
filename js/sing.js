/* 唱歌模块:今日练声步骤打卡(localStorage 持久化,每日重置) */
const SING_STEPS = [
  { name: '气息练习', dur: '5min' },
  { name: '开嗓哼鸣', dur: '5min' },
  { name: '音阶琶音', dur: '10min' },
  { name: '歌曲片段', dur: '20min' },
  { name: '录音复盘', dur: '10min' }
];

function _singToday() {
  return new Date().toDateString();
}

function initSing() {
  const steps = $$('#panel-sing .sing-step');
  if (!steps.length) return;

  const today = _singToday();
  const saved = Store.get(Store.KEYS.TODAY, '') === today
    ? Store.get('pw_sing_done', [])
    : [];

  function render() {
    steps.forEach((el, i) => {
      el.classList.toggle('done', saved.includes(i));
    });
  }

  steps.forEach((el, i) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      const idx = saved.indexOf(i);
      if (idx === -1) saved.push(i);
      else saved.splice(idx, 1);
      // 重置日期
      if (Store.get(Store.KEYS.TODAY, '') !== today) {
        Store.set(Store.KEYS.TODAY, today);
      }
      Store.set('pw_sing_done', saved);
      render();
    });
  });

  render();
}

/* ===== 我的歌单:支持从汽水音乐导入 ===== */
const PLAYLIST_KEY = 'pw_sing_playlist';

function _singRenderPlaylist() {
  const ul = $('#sing-playlist');
  if (!ul) return;
  const list = Store.get(PLAYLIST_KEY, []);
  if (!list.length) {
    ul.innerHTML = '<li class="note-item" style="opacity:.5;text-align:center;">还没有歌曲,点上方「从汽水音乐导入」添加吧~</li>';
    return;
  }
  ul.innerHTML = list.map((s, i) => `
    <a class="media-item" href="https://search.bilibili.com/all?keyword=${encodeURIComponent(s)}" target="_blank" rel="noopener noreferrer">
      🎵 ${escapeHtml(s)}
    </a>
  `).join('');
}

// 解析粘贴的文本(每行一首,自动去掉序号、歌手等)
function _singParseText(text) {
  if (!text) return [];
  return text.split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      // 去掉开头序号: "1. " "1、" "1)" "01 "
      line = line.replace(/^\s*\d+[\.\、\)\]\s]+/, '');
      // 去掉末尾的播放时长 "03:45"
      line = line.replace(/\s*\d{1,2}:\d{2}\s*$/, '');
      // 去掉 " - 歌手" 后缀(保留歌名)
      // 不删歌手,保留完整信息更实用
      return line.trim();
    })
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i); // 去重
}

// 尝试解析汽水音乐歌单链接
async function _singParseQishuiLink(link) {
  const proxies = [
    u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
    u => 'https://corsproxy.io/?url=' + encodeURIComponent(u)
  ];
  for (const makeUrl of proxies) {
    try {
      const res = await fetch(makeUrl(link), { signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined });
      if (!res.ok) continue;
      const html = await res.text();
      // 尝试从 HTML 提取歌曲名
      const names = new Set();
      // 汽水音乐页面可能把数据放在 _ROUTER_DATA 或 window.__INITIAL_STATE__
      const m = html.match(/<title>([^<]+)<\/title>/);
      // 简单提取:找 "songName":"xxx" 或 "title":"xxx" 模式
      const songMatches = html.match(/"(?:songName|title|name)":"([^"]{1,80})"/g);
      if (songMatches) {
        songMatches.forEach(s => {
          const name = s.match(/:"([^"]+)"/)[1];
          if (name && name.length > 1 && name.length < 60) names.add(name);
        });
      }
      // 兜底:从 media-list 或歌曲列表项提取
      if (!names.size) {
        const items = html.match(/class="[^"]*(?:song|track|music)[^"]*"[^>]*>([^<]{1,60})</gi);
        if (items) items.forEach(it => {
          const t = it.match(/>([^<]+)</);
          if (t && t[1].trim().length > 1) names.add(t[1].trim());
        });
      }
      if (names.size) return Array.from(names);
    } catch (e) { /* 试下一个代理 */ }
  }
  return null;
}

function _singShowImportModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-mask';
  modal.innerHTML = `
    <div class="modal-box">
      <h3 style="margin:0 0 12px;">🎵 从汽水音乐导入歌单</h3>
      <p class="smart-tip" style="text-align:left;">
        方式一:在汽水音乐 App 打开歌单 → 分享 → <b>复制链接</b>,粘贴到下方(自动解析)<br>
        方式二:在汽水音乐分享时<b>复制文本</b>(歌名列表),粘贴到下方(最可靠)
      </p>
      <textarea id="qishui-input" placeholder="粘贴汽水音乐歌单链接,或每行一首歌曲名..." style="width:100%;min-height:140px;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg-secondary);color:var(--text);resize:vertical;font-family:inherit;"></textarea>
      <div id="qishui-status" style="font-size:13px;color:var(--text-secondary);margin:8px 0;min-height:18px;"></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button class="btn-ghost" id="qishui-cancel">取消</button>
        <button class="btn-primary" id="qishui-confirm">导入</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const ta = modal.querySelector('#qishui-input');
  const status = modal.querySelector('#qishui-status');
  const confirmBtn = modal.querySelector('#qishui-confirm');
  const cancelBtn = modal.querySelector('#qishui-cancel');

  const close = () => modal.remove();
  cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  confirmBtn.addEventListener('click', async () => {
    const text = ta.value.trim();
    if (!text) { status.textContent = '请粘贴内容'; return; }

    confirmBtn.disabled = true;
    confirmBtn.textContent = '解析中...';

    let songs = [];
    // 判断是链接还是文本
    const isLink = /^https?:\/\//i.test(text);
    if (isLink) {
      status.textContent = '正在解析汽水音乐歌单链接...';
      songs = (await _singParseQishuiLink(text)) || [];
      if (!songs.length) {
        status.innerHTML = '⚠️ 链接解析失败(可能需要登录或代理不可用)。<br>请改用「分享 → 复制文本」的方式,把歌名列表粘贴进来。';
        confirmBtn.disabled = false;
        confirmBtn.textContent = '导入';
        return;
      }
    } else {
      songs = _singParseText(text);
    }

    if (!songs.length) {
      status.textContent = '未识别到歌曲,请检查内容格式';
      confirmBtn.disabled = false;
      confirmBtn.textContent = '导入';
      return;
    }

    // 合并去重
    const exist = Store.get(PLAYLIST_KEY, []);
    const merged = Array.from(new Set([...exist, ...songs]));
    Store.set(PLAYLIST_KEY, merged);
    showToast(`✅ 已导入 ${songs.length} 首歌曲`);
    _singRenderPlaylist();
    close();
  });

  ta.focus();
}

function initSingPlaylist() {
  const importBtn = $('#sing-import-qishui');
  const clearBtn = $('#sing-clear-playlist');
  if (importBtn) importBtn.addEventListener('click', _singShowImportModal);
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('确定清空我的歌单?')) return;
      Store.set(PLAYLIST_KEY, []);
      _singRenderPlaylist();
      showToast('已清空歌单');
    });
  }
  _singRenderPlaylist();
}

if (typeof window !== 'undefined') {
  window.initSing = initSing;
  window.initSingPlaylist = initSingPlaylist;
}
