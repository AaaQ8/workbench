(function () {
  var KEY = 'pw_meta_diary';

  function sel(selector) {
    return document.querySelector(selector);
  }

  function selAll(selector) {
    return document.querySelectorAll(selector);
  }

  function escapeHtml(str) {
    if (typeof Store !== 'undefined' && typeof Store.escapeHtml === 'function') {
      return Store.escapeHtml(str);
    }
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function loadDiary() {
    return Store.get(KEY) || [];
  }

  function saveDiary(list) {
    Store.set(KEY, list);
  }

  function saveChallengeState() {
    var state = {};
    var cbs = selAll('#panel-meta .challenge-cb');
    cbs.forEach(function (cb) {
      state[cb.dataset.id] = cb.checked;
    });
    Store.set('pw_meta_challenges', state);
  }

  function restoreChallengeState() {
    var state = Store.get('pw_meta_challenges') || {};
    var cbs = selAll('#panel-meta .challenge-cb');
    cbs.forEach(function (cb) {
      if (state[cb.dataset.id] !== undefined) {
        cb.checked = !!state[cb.dataset.id];
      }
    });
  }

  function formatDate(ts) {
    var d = new Date(ts);
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function renderMeta() {
    var list = loadDiary();
    var ul = sel('#meta-list');
    if (!ul) return;
    ul.innerHTML = '';

    list.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'diary-item';
      li.dataset.id = item.id;

      var titleSpan = document.createElement('span');
      titleSpan.className = 'diary-title';
      titleSpan.textContent = item.title || '(无标题)';

      var dateSpan = document.createElement('span');
      dateSpan.className = 'diary-date';
      dateSpan.textContent = ' — ' + formatDate(item.createdAt);

      var contentPreview = document.createElement('div');
      contentPreview.className = 'diary-preview';
      contentPreview.textContent = item.content ? item.content.replace(/\n/g, ' ').slice(0, 80) : '';

      li.appendChild(titleSpan);
      li.appendChild(dateSpan);
      li.appendChild(contentPreview);

      li.addEventListener('click', function () {
        editDiary(item.id);
      });

      li.addEventListener('dblclick', function (e) {
        e.preventDefault();
        if (confirm('确定删除这条日记吗？')) {
          deleteDiary(item.id);
        }
      });

      li.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        if (confirm('确定删除这条日记吗？')) {
          deleteDiary(item.id);
        }
      });

      ul.appendChild(li);
    });
  }

  function editDiary(id) {
    var list = loadDiary();
    var item = list.find(function (x) { return x.id === id; });
    if (!item) return;
    sel('#meta-title').value = item.title || '';
    sel('#meta-content').value = item.content || '';
    var saveBtn = sel('#meta-save');
    saveBtn.dataset.editingId = id;
    saveBtn.textContent = '更新';
  }

  function deleteDiary(id) {
    var list = loadDiary().filter(function (x) { return x.id !== id; });
    saveDiary(list);
    var saveBtn = sel('#meta-save');
    if (saveBtn.dataset.editingId === id) {
      saveBtn.dataset.editingId = '';
      saveBtn.textContent = '保存';
      sel('#meta-title').value = '';
      sel('#meta-content').value = '';
    }
    renderMeta();
  }

  function saveMeta() {
    var title = sel('#meta-title').value.trim();
    var content = sel('#meta-content').value.trim();
    if (!title && !content) return;

    var saveBtn = sel('#meta-save');
    var editingId = saveBtn.dataset.editingId;
    var list = loadDiary();

    if (editingId) {
      var item = list.find(function (x) { return x.id === editingId; });
      if (item) {
        item.title = title;
        item.content = content;
      }
      saveBtn.dataset.editingId = '';
      saveBtn.textContent = '保存';
    } else {
      list.unshift({
        id: 'm_' + Date.now(),
        title: title,
        content: content,
        createdAt: Date.now()
      });
    }

    saveDiary(list);
    sel('#meta-title').value = '';
    sel('#meta-content').value = '';
    renderMeta();
  }

  function initMeta() {
    var saveBtn = sel('#meta-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveMeta);
    }

    var cbs = selAll('#panel-meta .challenge-cb');
    cbs.forEach(function (cb) {
      cb.addEventListener('change', saveChallengeState);
    });

    restoreChallengeState();
    renderMeta();
  }

  window.initMeta = initMeta;
  window.loadMeta = renderMeta;
})();
