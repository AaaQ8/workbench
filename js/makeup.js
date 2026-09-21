/* 美妆模块:今日妆容步骤打卡(localStorage 持久化,每日重置) */
function initMakeup() {
  const steps = $$('#panel-makeup .makeup-step');
  if (!steps.length) return;

  const today = new Date().toDateString();
  const saved = Store.get(Store.KEYS.TODAY, '') === today
    ? Store.get('pw_makeup_done', [])
    : [];

  function render() {
    steps.forEach((el, i) => {
      el.classList.toggle('done', saved.includes(i));
    });
  }

  steps.forEach((el, i) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      const idx = saved.indexOf(i);
      if (idx === -1) saved.push(i);
      else saved.splice(idx, 1);
      if (Store.get(Store.KEYS.TODAY, '') !== today) {
        Store.set(Store.KEYS.TODAY, today);
      }
      Store.set('pw_makeup_done', saved);
      render();
    });
  });

  render();
}

/* 我的爱用品:用户自定义列表,点击跳 B站搜索,可删除 */
function initMakeupFavs() {
  const input = $('#makeup-fav-input');
  const addBtn = $('#makeup-fav-add');
  const list = $('#makeup-fav-list');
  if (!input || !addBtn || !list) return;

  const KEY = 'pw_makeup_favs';
  // 首次使用给几个默认示例,之后完全由用户控制
  let favs = Store.get(KEY, null);
  if (favs === null) {
    favs = ['💄 YSL 唇釉 #12', '🖌️ NARS 腮红 #Orgasm', '👁️ 3CE 眼影盘 #Overtake'];
    Store.set(KEY, favs);
  }

  function render() {
    list.innerHTML = '';
    if (!favs.length) {
      list.innerHTML = '<li class="note-item" style="opacity:.5;">还没有爱用品,在上方添加吧</li>';
      return;
    }
    favs.forEach((name, i) => {
      const li = document.createElement('li');
      li.className = 'media-item fav-item';
      const url = 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(name + ' 评测');
      li.innerHTML = `
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="fav-link">${escapeHtml(name)}</a>
        <button class="fav-del" data-i="${i}" title="删除">✕</button>
      `;
      list.appendChild(li);
    });
  }

  function add() {
    const v = input.value.trim();
    if (!v) return;
    favs.unshift(v);
    Store.set(KEY, favs);
    input.value = '';
    render();
  }

  addBtn.addEventListener('click', add);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  list.addEventListener('click', e => {
    const btn = e.target.closest('.fav-del');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const i = parseInt(btn.dataset.i, 10);
    favs.splice(i, 1);
    Store.set(KEY, favs);
    render();
  });

  render();
}

if (typeof window !== 'undefined') {
  window.initMakeup = initMakeup;
  window.initMakeupFavs = initMakeupFavs;
}
