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
