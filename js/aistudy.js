const AI_NOTES_KEY = 'pw_ai_notes';

let editingAiId = null;

function loadAiNotes() {
  const list = Store.get(AI_NOTES_KEY, []);
  const ul = $('#ai-note-list');
  if (!ul) return;
  ul.innerHTML = '';
  if (list.length === 0) {
    ul.innerHTML = '<li style="color:#999;padding:8px 12px;">还没有 AI 学习笔记,写一条吧!</li>';
    return;
  }
  list.forEach(n => {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.innerHTML = `
      <div class="note-title">🤖 ${escapeHtml(n.title || '(无标题)')}</div>
      <div class="note-preview">${escapeHtml((n.content || '').slice(0, 80))}</div>
      <div class="note-date">${formatDate(n.createdAt)}</div>
      <div style="margin-top:6px;display:flex;gap:6px;">
        <button class="btn-ghost small" data-edit="${n.id}">编辑</button>
        <button class="btn-danger small" data-del="${n.id}">删除</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

function initAistudy() {
  loadAiNotes();

  const saveBtn = $('#ai-note-save');
  const titleEl = $('#ai-note-title');
  const contentEl = $('#ai-note-content');
  if (!saveBtn || !titleEl || !contentEl) return;

  saveBtn.addEventListener('click', () => {
    const title = titleEl.value.trim();
    const content = contentEl.value.trim();
    if (!title && !content) {
      alert('请填写标题或内容!');
      return;
    }
    const list = Store.get(AI_NOTES_KEY, []);
    if (editingAiId) {
      const idx = list.findIndex(n => n.id === editingAiId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], title, content, updatedAt: Date.now() };
      }
      editingAiId = null;
      saveBtn.textContent = '保存笔记';
    } else {
      list.unshift({ id: uid(), title, content, createdAt: Date.now() });
    }
    Store.set(AI_NOTES_KEY, list);
    titleEl.value = '';
    contentEl.value = '';
    loadAiNotes();
  });

  const ul = $('#ai-note-list');
  if (ul) {
    ul.addEventListener('click', e => {
      const editId = e.target.dataset.edit;
      const delId = e.target.dataset.del;
      if (editId) {
        const list = Store.get(AI_NOTES_KEY, []);
        const n = list.find(x => x.id === editId);
        if (n) {
          titleEl.value = n.title;
          contentEl.value = n.content;
          editingAiId = editId;
          saveBtn.textContent = '更新笔记';
          titleEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (delId) {
        if (!confirm('确定要删除这条笔记吗?')) return;
        const list = Store.get(AI_NOTES_KEY, []).filter(x => x.id !== delId);
        Store.set(AI_NOTES_KEY, list);
        if (editingAiId === delId) {
          editingAiId = null;
          saveBtn.textContent = '保存笔记';
        }
        loadAiNotes();
      }
    });
  }
}

if (typeof window !== 'undefined') window.initAistudy = initAistudy;
