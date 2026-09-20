/* 搞钱想法记录模块 */
function initMoney() {
  const input = document.getElementById('money-idea');
  const addBtn = document.getElementById('money-add');
  const list = document.getElementById('money-list');
  if (!input || !addBtn || !list) return;

  const KEY = (Store.KEYS && Store.KEYS.MONEY_IDEAS) || 'pw_money_ideas';

  function esc(s) {
    return (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function load() {
    const ideas = Store.get(KEY, []);
    list.innerHTML = '';
    if (!ideas.length) {
      list.innerHTML = '<li style="opacity:.5;padding:8px 4px;">还没有想法,记录第一个搞钱灵感吧 💡</li>';
      return;
    }
    ideas.forEach(it => {
      const li = document.createElement('li');
      li.className = 'note-item';
      const date = (typeof formatDate === 'function') ? formatDate(it.createdAt) : '';
      li.innerHTML =
        '<div class="note-title">💡 ' + esc(it.text) + '</div>' +
        '<div class="note-date">' + date + ' <button class="btn-ghost small money-del" data-id="' + it.id + '" style="margin-left:8px;">删除</button></div>';
      list.appendChild(li);
    });
  }

  function add() {
    const text = input.value.trim();
    if (!text) return;
    const ideas = Store.get(KEY, []);
    ideas.unshift({ id: (typeof uid === 'function' ? uid() : ('mi_' + Date.now())), text, createdAt: Date.now() });
    Store.set(KEY, ideas);
    input.value = '';
    load();
  }

  addBtn.addEventListener('click', add);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  list.addEventListener('click', e => {
    if (e.target.classList.contains('money-del')) {
      if (!confirm('确定删除这个想法吗?')) return;
      const id = e.target.dataset.id;
      Store.set(KEY, Store.get(KEY, []).filter(x => x.id !== id));
      load();
    }
  });

  load();
}

if (typeof window !== 'undefined') window.initMoney = initMoney;
