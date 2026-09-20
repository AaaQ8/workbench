let _favFilter = '';

function loadFavorites() {
  let list = Store.get(Store.KEYS.FAVORITES, []).slice().sort((a, b) => b.createdAt - a.createdAt);
  if (_favFilter) list = list.filter(f => (f.category || '') === _favFilter);
  const ul = $('#fav-list');
  if (!ul) return;
  ul.innerHTML = '';
  if (_favFilter && list.length === 0) {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.textContent = `没有「${_favFilter}」类收藏,再点一次分类标签显示全部`;
    ul.appendChild(li);
  }
  list.forEach(f => {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.innerHTML = `
      <div class="note-title">${escapeHtml(f.title)} <span class="note-date" style="margin-left:8px">${escapeHtml(f.category || '')}</span></div>
      <div class="note-preview">${f.url ? `<a href="${escapeHtml(f.url)}" target="_blank" style="color:var(--accent);text-decoration:none">${escapeHtml(f.url)}</a>` : ''}</div>
      <div class="note-date">${formatDate(f.createdAt)}</div>
      <button class="fav-delete" data-id="${f.id}" title="删除">✕</button>
    `;
    ul.appendChild(li);
  });
}

function initFavorites() {
  const add = $('#fav-add');
  if (!add) return;
  add.addEventListener('click', () => {
    const title = $('#fav-title').value.trim();
    const url = $('#fav-url').value.trim();
    const category = $('#fav-cat').value;
    if (!title) {
      alert('请输入收藏标题');
      return;
    }
    const list = Store.get(Store.KEYS.FAVORITES, []);
    list.unshift({ id: uid(), title, url, category, createdAt: Date.now() });
    Store.set(Store.KEYS.FAVORITES, list);
    $('#fav-title').value = '';
    $('#fav-url').value = '';
    loadFavorites();
  });

  const ul = $('#fav-list');
  if (ul) {
    ul.addEventListener('click', e => {
      if (e.target.classList.contains('fav-delete')) {
        const id = e.target.dataset.id;
        const list = Store.get(Store.KEYS.FAVORITES, []).filter(f => f.id !== id);
        Store.set(Store.KEYS.FAVORITES, list);
        loadFavorites();
      }
    });
  }

  // 分类标签筛选
  const catBox = $('#fav-cat-tags');
  if (catBox) {
    catBox.addEventListener('click', e => {
      const tag = e.target.closest('.tag-item');
      if (!tag) return;
      const cat = tag.dataset.cat;
      if (_favFilter === cat) {
        _favFilter = '';
        tag.classList.remove('active');
      } else {
        _favFilter = cat;
        $$('#fav-cat-tags .tag-item').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
      }
      loadFavorites();
    });
  }

  loadFavorites();
}
