/* 剪辑:项目管理 CRUD(状态循环 + 删除) */
const EDIT_STATUSES = ['草稿', '剪辑中', '已完成', '已发布'];

function loadEditProjects() {
  const list = Store.get(Store.KEYS.EDIT_PROJECTS, []);
  const ul = $('#edit-project-list');
  if (!ul) return;
  ul.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.textContent = '还没有项目,先添加一个吧~';
    ul.appendChild(li);
    return;
  }
  list.forEach(p => {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.dataset.id = p.id;
    li.innerHTML = `
      <div class="note-title">🎬 ${escapeHtml(p.name)}</div>
      <span class="project-tag status-${EDIT_STATUSES.indexOf(p.status)}">${escapeHtml(p.status)}</span>
      <button class="fav-delete" data-id="${p.id}" title="删除">✕</button>
    `;
    li.querySelector('.note-title').addEventListener('click', () => {
      const projects = Store.get(Store.KEYS.EDIT_PROJECTS, []);
      const item = projects.find(x => x.id === p.id);
      if (!item) return;
      const idx = EDIT_STATUSES.indexOf(item.status);
      item.status = EDIT_STATUSES[(idx + 1) % EDIT_STATUSES.length];
      Store.set(Store.KEYS.EDIT_PROJECTS, projects);
      loadEditProjects();
    });
    ul.appendChild(li);
  });
}

function initEdit() {
  const add = $('#edit-project-add');
  const input = $('#edit-project-input');
  if (!add || !input) return;

  add.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) {
      alert('先给项目起个名字吧~');
      return;
    }
    const list = Store.get(Store.KEYS.EDIT_PROJECTS, []);
    list.unshift({ id: uid(), name, status: '草稿', createdAt: Date.now() });
    Store.set(Store.KEYS.EDIT_PROJECTS, list);
    input.value = '';
    loadEditProjects();
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') add.click(); });

  const ul = $('#edit-project-list');
  if (ul) {
    ul.addEventListener('click', e => {
      if (e.target.classList.contains('fav-delete')) {
        const id = e.target.dataset.id;
        const list = Store.get(Store.KEYS.EDIT_PROJECTS, []).filter(x => x.id !== id);
        Store.set(Store.KEYS.EDIT_PROJECTS, list);
        loadEditProjects();
      }
    });
  }

  loadEditProjects();
}

/* ===== 视频库:存 IndexedDB(突破 5MB,可存大视频) ===== */
const EV_KEY = 'pw_edit_videos';

function _evFmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

async function _evGetList() {
  try {
    const list = await Store.idb.get(EV_KEY);
    return Array.isArray(list) ? list : [];
  } catch (e) { return []; }
}

async function _evSaveList(list) {
  try { await Store.idb.set(EV_KEY, list); return true; }
  catch (e) { showToast('保存失败: ' + (e.message || e)); return false; }
}

async function _evRenderList() {
  const box = $('#edit-video-list');
  const sizeEl = $('#edit-video-size');
  if (!box) return;
  const list = await _evGetList();
  const total = list.reduce((s, v) => s + (v.size || 0), 0);
  if (sizeEl) sizeEl.textContent = `共 ${list.length} 个 · ${_evFmtSize(total)}`;
  box.innerHTML = '';
  if (!list.length) {
    box.innerHTML = '<div class="note-item" style="opacity:.5;text-align:center;padding:24px;">还没有视频,点上方按钮上传吧~</div>';
    return;
  }
  list.forEach(v => {
    const card = document.createElement('div');
    card.className = 'edit-video-card';
    card.innerHTML = `
      <video controls preload="metadata" playsinline></video>
      <div class="ev-info">
        <div class="ev-name" title="${escapeHtml(v.name)}">${escapeHtml(v.name)}</div>
        <div class="ev-meta">${_evFmtSize(v.size || 0)} · ${new Date(v.ts).toLocaleString('zh-CN')}</div>
        <button class="ev-del" data-id="${v.id}">删除</button>
      </div>
    `;
    const video = card.querySelector('video');
    video.src = URL.createObjectURL(v.blob);
    box.appendChild(card);
  });
}

function initEditVideos() {
  const uploadBtn = $('#edit-video-upload');
  const input = $('#edit-video-input');
  if (!uploadBtn || !input) return;

  uploadBtn.addEventListener('click', () => input.click());
  input.addEventListener('change', async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    uploadBtn.disabled = true;
    uploadBtn.textContent = '上传中...';
    const list = await _evGetList();
    for (const file of files) {
      if (!file.type.startsWith('video/')) continue;
      list.unshift({
        id: uid(),
        name: file.name,
        size: file.size,
        ts: Date.now(),
        blob: file
      });
    }
    const ok = await _evSaveList(list);
    uploadBtn.disabled = false;
    uploadBtn.textContent = '⬆️ 上传视频';
    input.value = '';
    if (ok) {
      showToast(`✅ 已上传 ${files.length} 个视频`);
      _evRenderList();
    }
  });

  // 删除(事件委托)
  const box = $('#edit-video-list');
  if (box) {
    box.addEventListener('click', async e => {
      const btn = e.target.closest('.ev-del');
      if (!btn) return;
      const id = btn.dataset.id;
      const list = (await _evGetList()).filter(v => v.id !== id);
      await _evSaveList(list);
      _evRenderList();
      showToast('已删除视频');
    });
  }

  _evRenderList();
}

if (typeof window !== 'undefined') {
  window.initEdit = initEdit;
  window.initEditVideos = initEditVideos;
}
