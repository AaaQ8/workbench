(function () {
  var _noteFilter = '';  // 当前知识分类筛选关键词(空=显示全部)

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

  function getNotes() {
    return Store.get(Store.KEYS.NOTES) || [];
  }

  function setNotes(list) {
    Store.set(Store.KEYS.NOTES, list);
  }

  function formatDate(ts) {
    var d = new Date(ts);
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function loadNotes() {
    var list = getNotes();
    var ul = sel('#note-list');
    if (!ul) return;
    ul.innerHTML = '';

    var filtered = _noteFilter
      ? list.filter(function (item) {
          var kw = _noteFilter;
          return (item.title || '').indexOf(kw) !== -1 || (item.content || '').indexOf(kw) !== -1;
        })
      : list;

    if (_noteFilter && filtered.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'note-item';
      empty.textContent = '没有含「' + _noteFilter + '」的笔记,再点一次标签可显示全部';
      ul.appendChild(empty);
    }

    filtered.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'note-item';
      li.dataset.id = item.id;

      var info = document.createElement('div');
      info.className = 'note-info';

      var titleEl = document.createElement('span');
      titleEl.className = 'note-title';
      titleEl.textContent = item.title || '(无标题)';

      var preview = document.createElement('span');
      preview.className = 'note-preview';
      var contentText = (item.content || '').replace(/\s+/g, ' ');
      preview.textContent = contentText.length > 60 ? contentText.slice(0, 60) + '…' : contentText;

      var dateEl = document.createElement('span');
      dateEl.className = 'note-date';
      dateEl.textContent = ' — ' + formatDate(item.createdAt);

      info.appendChild(titleEl);
      info.appendChild(dateEl);
      if (preview.textContent) {
        var previewDiv = document.createElement('div');
        previewDiv.className = 'note-preview-line';
        previewDiv.textContent = preview.textContent;
        info.appendChild(previewDiv);
      }

      var delBtn = document.createElement('button');
      delBtn.className = 'note-delete';
      delBtn.textContent = '删除';
      delBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm('确定删除这条笔记吗？')) {
          deleteNote(item.id);
        }
      });

      li.addEventListener('click', function () {
        editNote(item.id);
      });

      li.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        if (confirm('确定删除这条笔记吗？')) {
          deleteNote(item.id);
        }
      });

      li.appendChild(info);
      li.appendChild(delBtn);
      ul.appendChild(li);
    });
  }

  function editNote(id) {
    var list = getNotes();
    var item = list.find(function (x) { return x.id === id; });
    if (!item) return;
    // 若正处于预览模式,先切回编辑模式
    var previewEl = sel('#note-preview');
    if (previewEl && previewEl.style.display !== 'none') {
      previewEl.style.display = 'none';
      sel('#note-content').style.display = '';
      sel('#note-preview-toggle').textContent = '预览';
    }
    sel('#note-title').value = item.title || '';
    sel('#note-content').value = item.content || '';
    var saveBtn = sel('#note-save');
    saveBtn.dataset.editingId = id;
    saveBtn.textContent = '更新';
  }

  function deleteNote(id) {
    var list = getNotes().filter(function (x) { return x.id !== id; });
    setNotes(list);
    var saveBtn = sel('#note-save');
    if (saveBtn.dataset.editingId === id) {
      saveBtn.dataset.editingId = '';
      saveBtn.textContent = '保存';
      sel('#note-title').value = '';
      sel('#note-content').value = '';
    }
    loadNotes();
  }

  function saveNote() {
    var title = sel('#note-title').value.trim();
    var content = sel('#note-content').value.trim();
    if (!title && !content) return;

    var saveBtn = sel('#note-save');
    var editingId = saveBtn.dataset.editingId;
    var list = getNotes();

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
        id: 'n_' + Date.now(),
        title: title,
        content: content,
        createdAt: Date.now()
      });
    }

    setNotes(list);
    sel('#note-title').value = '';
    sel('#note-content').value = '';
    loadNotes();
  }

  function renderMarkdownPreview() {
    var previewEl = sel('#note-preview');
    var toggleBtn = sel('#note-preview-toggle');
    var contentEl = sel('#note-content');
    if (!previewEl || !toggleBtn || !contentEl) return;
    var visible = previewEl.style.display !== 'none';
    if (!visible) {
      var src = contentEl.value;
      if (typeof marked !== 'undefined' && marked.parse) {
        previewEl.innerHTML = marked.parse(src || '_（暂无内容）_');
      } else {
        previewEl.textContent = src || '（暂无内容）';
      }
      previewEl.style.display = 'block';
      contentEl.style.display = 'none';
      toggleBtn.textContent = '编辑';
    } else {
      previewEl.style.display = 'none';
      contentEl.style.display = '';
      toggleBtn.textContent = '预览';
    }
  }

  function initNoteTagFilter() {
    var cloud = sel('#panel-knowledge .tag-cloud');
    if (!cloud) return;
    cloud.addEventListener('click', function (e) {
      var tag = e.target.closest('.tag-item');
      if (!tag) return;
      // 去掉 emoji 前缀,取纯文字作为关键词
      var kw = tag.textContent.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '').trim();
      if (!kw) return;
      if (_noteFilter === kw) {
        _noteFilter = '';
        tag.classList.remove('active');
      } else {
        _noteFilter = kw;
        selAll('#panel-knowledge .tag-item').forEach(function (t) { t.classList.remove('active'); });
        tag.classList.add('active');
      }
      loadNotes();
    });
  }

  function initKnowledge() {
    var saveBtn = sel('#note-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveNote);
    }
    var toggleBtn = sel('#note-preview-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', renderMarkdownPreview);
    }
    initNoteTagFilter();
    loadNotes();
  }

  window.initKnowledge = initKnowledge;
  window.loadNotes = loadNotes;
})();
