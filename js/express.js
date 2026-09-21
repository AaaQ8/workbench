/* 表达能力 - 录音复盘记录模块 */
function initExpress() {
  const topic = document.getElementById('express-topic');
  const review = document.getElementById('express-review');
  const saveBtn = document.getElementById('express-save');
  const list = document.getElementById('express-list');
  if (!saveBtn || !list) return;

  const KEY = (Store.KEYS && Store.KEYS.EXPRESS_LOG) || 'pw_express_log';

  function esc(s) {
    return (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function load() {
    const logs = Store.get(KEY, []);
    list.innerHTML = '';
    if (!logs.length) {
      list.innerHTML = '<li style="opacity:.5;padding:8px 4px;">还没有复盘记录,完成一次表达练习后来记录吧 🎤</li>';
      return;
    }
    logs.forEach(it => {
      const li = document.createElement('li');
      li.className = 'note-item';
      const date = (typeof formatDate === 'function') ? formatDate(it.createdAt) : '';
      const preview = (it.review || '').replace(/\s+/g, ' ').slice(0, 60);
      li.innerHTML =
        '<div class="note-title">🎤 ' + esc(it.topic || '(未命名话题)') + '</div>' +
        '<div class="note-preview">' + esc(preview) + '</div>' +
        '<div class="note-date">' + date + ' <button class="btn-ghost small express-del" data-id="' + it.id + '" style="margin-left:8px;">删除</button></div>';
      list.appendChild(li);
    });
  }

  function save() {
    const t = topic.value.trim();
    const r = review.value.trim();
    if (!t && !r) { alert('请填写话题或复盘内容'); return; }
    const logs = Store.get(KEY, []);
    logs.unshift({
      id: (typeof uid === 'function' ? uid() : ('ex_' + Date.now())),
      topic: t,
      review: r,
      createdAt: Date.now()
    });
    Store.set(KEY, logs);
    topic.value = '';
    review.value = '';
    load();
  }

  saveBtn.addEventListener('click', save);
  list.addEventListener('click', e => {
    if (e.target.classList.contains('express-del')) {
      if (!confirm('确定删除这条复盘吗?')) return;
      const id = e.target.dataset.id;
      Store.set(KEY, Store.get(KEY, []).filter(x => x.id !== id));
      load();
    }
  });

  load();
}

if (typeof window !== 'undefined') window.initExpress = initExpress;

/* ============ 表达录音(MediaRecorder) ============ */
let _erRecorder = null;
let _erChunks = [];
let _erCurBlob = null;
let _erTimer = null;
let _erStartTs = 0;

function _erFmtDur(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 录音存 IndexedDB(突破 5MB 限制),兼容旧 localStorage 数据自动迁移
const ER_KEY = Store.KEYS.EXPRESS_RECORDINGS;

async function _erGetList() {
  try {
    let list = await Store.idb.get(ER_KEY);
    if (Array.isArray(list)) return list;
    // 旧数据迁移:localStorage 里的搬到 IndexedDB
    const old = Store.get(ER_KEY, null);
    if (Array.isArray(old)) {
      await Store.idb.set(ER_KEY, old);
      try { localStorage.removeItem(ER_KEY); } catch (e) {}
      return old;
    }
  } catch (e) {}
  return [];
}

async function _erSaveList(list) {
  try { await Store.idb.set(ER_KEY, list); return true; }
  catch (e) { showToast('保存失败: ' + (e.message || e)); return false; }
}

async function _erRenderList() {
  const ul = document.getElementById('express-rec-list');
  if (!ul) return;
  const list = await _erGetList();
  ul.innerHTML = '';
  if (!list.length) {
    ul.innerHTML = '<li class="note-item" style="opacity:.5;">还没有录音,按下「开始录音」录一段吧 🎙️</li>';
    return;
  }
  list.forEach(r => {
    const li = document.createElement('li');
    li.className = 'express-rec-item';
    li.innerHTML = `
      <div class="express-rec-head">
        <span class="express-rec-name">${escapeHtml(r.name || '未命名')} · ${_erFmtDur(r.dur || 0)}</span>
        <button class="express-rec-del" data-id="${r.id}" title="删除">删除</button>
      </div>
      <audio controls src="${r.data}"></audio>
    `;
    ul.appendChild(li);
  });
}

function initExpressRec() {
  const startBtn = $('#express-rec-start');
  const stopBtn = $('#express-rec-stop');
  const saveBtn = $('#express-rec-save');
  const statusEl = $('#express-rec-status');
  const preview = $('#express-rec-preview');
  const nameInput = $('#express-rec-name');
  if (!startBtn || !stopBtn) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    statusEl.textContent = '浏览器不支持录音';
    startBtn.disabled = true;
    _erRenderList();
    return;
  }

  startBtn.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      _erChunks = [];
      // 优先用 audio/mp4 (Safari),否则 audio/webm
      let mime = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) mime = 'audio/mp4';
      else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mime = 'audio/webm;codecs=opus';
      _erRecorder = new MediaRecorder(stream, { mimeType: mime });
      _erRecorder.ondataavailable = e => { if (e.data.size > 0) _erChunks.push(e.data); };
      _erRecorder.onstop = () => {
        _erCurBlob = new Blob(_erChunks, { type: mime });
        const url = URL.createObjectURL(_erCurBlob);
        if (preview) {
          preview.src = url;
          preview.style.display = 'block';
        }
        if (saveBtn) saveBtn.disabled = false;
        if (statusEl) statusEl.textContent = '录音完成,可保存或重录';
        stream.getTracks().forEach(t => t.stop());
        clearInterval(_erTimer);
      };
      _erRecorder.start();
      _erStartTs = Date.now();
      startBtn.disabled = true;
      stopBtn.disabled = false;
      if (saveBtn) saveBtn.disabled = true;
      if (statusEl) statusEl.textContent = '录音中... 00:00';
      _erTimer = setInterval(() => {
        const dur = (Date.now() - _erStartTs) / 1000;
        if (statusEl) statusEl.textContent = `录音中... ${_erFmtDur(dur)}`;
        if (dur >= 60) stopBtn.click(); // 自动 60 秒封顶
      }, 250);
    } catch (e) {
      if (statusEl) statusEl.textContent = '麦克风授权失败:' + (e.message || e.name);
    }
  });

  stopBtn.addEventListener('click', () => {
    if (_erRecorder && _erRecorder.state !== 'inactive') _erRecorder.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (!_erCurBlob) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const data = reader.result;
        const list = await _erGetList();
        list.unshift({
          id: typeof uid === 'function' ? uid() : 'er_' + Date.now(),
          name: (nameInput ? nameInput.value.trim() : '') || `录音 ${new Date().toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })}`,
          data,
          dur: (Date.now() - _erStartTs) / 1000,
          ts: Date.now()
        });
        if (!await _erSaveList(list)) return;
        if (nameInput) nameInput.value = '';
        if (preview) { preview.src = ''; preview.style.display = 'none'; }
        saveBtn.disabled = true;
        _erCurBlob = null;
        if (statusEl) statusEl.textContent = '已保存,准备就绪';
        _erRenderList();
        showToast('✅ 录音已保存');
      };
      reader.readAsDataURL(_erCurBlob);
    });
  }

  const ul = $('#express-rec-list');
  if (ul) {
    ul.addEventListener('click', async e => {
      const btn = e.target.closest('.express-rec-del');
      if (!btn) return;
      // 不依赖 confirm(部分移动 webview 拦截),直接删除+撤销提示
      const id = btn.dataset.id;
      const all = await _erGetList();
      const target = all.find(x => x.id === id);
      if (!target) return;
      const next = all.filter(x => x.id !== id);
      await _erSaveList(next);
      _erRenderList();
      showToast(`已删除「${target.name || '录音'}」`);
    });
  }

  _erRenderList();
}

if (typeof window !== 'undefined') window.initExpressRec = initExpressRec;
