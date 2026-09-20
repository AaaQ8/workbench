/* 书单:想读/在读/读完 记录,支持编辑(localStorage 持久化) */
const BOOK_STATUSES = [
  { k: 'wish',    label: '想读' },
  { k: 'reading', label: '在读' },
  { k: 'done',    label: '读完' }
];
let _bookFilter = 'all';
let _bookEditingId = null;

function _bookResetEdit() {
  _bookEditingId = null;
  const title = $('#book-title');
  const add = $('#book-add');
  const cancel = $('#book-cancel');
  if (title) title.value = '';
  const author = $('#book-author');
  if (author) author.value = '';
  if (add) add.textContent = '添加';
  if (cancel) cancel.style.display = 'none';
}

function loadBooks() {
  const list = Store.get(Store.KEYS.BOOKS, []);
  const ul = $('#book-list');
  if (!ul) return;
  ul.innerHTML = '';
  const shown = _bookFilter === 'all' ? list : list.filter(b => b.status === _bookFilter);
  if (!shown.length) {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.textContent = _bookFilter === 'all'
      ? '还没有书,先在上方记录一本吧~'
      : '这个分类下还没有书~';
    ul.appendChild(li);
    return;
  }
  shown.forEach(b => {
    const si = Math.max(0, BOOK_STATUSES.findIndex(s => s.k === b.status));
    const li = document.createElement('li');
    li.className = 'note-item';
    li.dataset.id = b.id;
    li.innerHTML = `
      <div class="note-title">📗 ${escapeHtml(b.title)}${b.author ? `<span style="color:var(--text-secondary);font-size:12px;"> · ${escapeHtml(b.author)}</span>` : ''}</div>
      <span class="project-tag status-${si}">${BOOK_STATUSES[si].label}</span>
      <button class="fav-delete book-edit" data-id="${b.id}" title="编辑">✎</button>
      <button class="fav-delete book-del" data-id="${b.id}" title="删除">✕</button>
    `;
    li.querySelector('.project-tag').addEventListener('click', () => {
      const books = Store.get(Store.KEYS.BOOKS, []);
      const item = books.find(x => x.id === b.id);
      if (!item) return;
      const ni = (BOOK_STATUSES.findIndex(s => s.k === item.status) + 1) % BOOK_STATUSES.length;
      item.status = BOOK_STATUSES[ni].k;
      Store.set(Store.KEYS.BOOKS, books);
      loadBooks();
    });
    ul.appendChild(li);
  });
}

function initBooks() {
  const add = $('#book-add');
  const title = $('#book-title');
  if (!add || !title) return;

  add.addEventListener('click', () => {
    const t = title.value.trim();
    if (!t) {
      alert(_bookEditingId ? '书名不能为空~' : '先写上书名吧~');
      return;
    }
    const books = Store.get(Store.KEYS.BOOKS, []);
    if (_bookEditingId) {
      const item = books.find(x => x.id === _bookEditingId);
      if (item) {
        item.title = t;
        item.author = $('#book-author').value.trim();
        item.status = $('#book-status').value || 'reading';
      }
      Store.set(Store.KEYS.BOOKS, books);
      _bookResetEdit();
    } else {
      books.unshift({
        id: uid(),
        title: t,
        author: $('#book-author').value.trim(),
        status: $('#book-status').value || 'reading',
        createdAt: Date.now()
      });
      Store.set(Store.KEYS.BOOKS, books);
      title.value = '';
      $('#book-author').value = '';
    }
    loadBooks();
  });
  title.addEventListener('keydown', e => { if (e.key === 'Enter') add.click(); });

  const cancel = $('#book-cancel');
  if (cancel) cancel.addEventListener('click', _bookResetEdit);

  const filters = $('#book-filters');
  if (filters) {
    filters.addEventListener('click', e => {
      const btn = e.target.closest('.focus-mode-btn');
      if (!btn) return;
      _bookFilter = btn.dataset.f;
      $$('#book-filters .focus-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadBooks();
    });
  }

  const ul = $('#book-list');
  if (ul) {
    ul.addEventListener('click', e => {
      const id = e.target.dataset.id;
      if (!id) return;
      if (e.target.classList.contains('book-edit')) {
        const b = Store.get(Store.KEYS.BOOKS, []).find(x => x.id === id);
        if (!b) return;
        _bookEditingId = id;
        title.value = b.title;
        $('#book-author').value = b.author || '';
        $('#book-status').value = b.status;
        add.textContent = '保存修改';
        cancel.style.display = '';
        title.focus();
      } else if (e.target.classList.contains('book-del')) {
        if (_bookEditingId === id) _bookResetEdit();
        Store.set(Store.KEYS.BOOKS, Store.get(Store.KEYS.BOOKS, []).filter(x => x.id !== id));
        loadBooks();
      }
    });
  }

  loadBooks();
}

if (typeof window !== 'undefined') window.initBooks = initBooks;
