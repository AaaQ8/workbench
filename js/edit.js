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

if (typeof window !== 'undefined') window.initEdit = initEdit;
