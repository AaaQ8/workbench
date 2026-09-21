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

/* ===== 收入渠道管理 ===== */
const INC_KEY = 'pw_income_channels';
const DEFAULT_INCOMES = [
  { id: 'inc_default_1', icon: '💼', name: '主业工资', desc: '稳定的收入基础', val: '¥8000/mo' },
  { id: 'inc_default_2', icon: '💻', name: '技术副业', desc: '接外包 / 做产品', val: '+¥3000' },
  { id: 'inc_default_3', icon: '📈', name: '投资理财', desc: '基金 / 股票 / 债券', val: '+¥500' },
  { id: 'inc_default_4', icon: '✍️', name: '内容创作', desc: '写作 / 视频 / 课程', val: '+¥800' }
];

function initIncomeChannels() {
  const listEl = $('#income-list');
  const addBtn = $('#inc-add');
  if (!listEl || !addBtn) return;

  // 首次使用填充默认数据
  if (!Store.get(INC_KEY, null)) {
    Store.set(INC_KEY, DEFAULT_INCOMES);
  }

  function render() {
    const list = Store.get(INC_KEY, []);
    listEl.innerHTML = '';
    if (!list.length) {
      listEl.innerHTML = '<div style="opacity:.5;text-align:center;padding:16px;">还没有收入渠道,在上方添加一个吧~</div>';
      $('#income-total').textContent = '';
      return;
    }
    list.forEach(it => {
      const div = document.createElement('div');
      div.className = 'income-item';
      div.innerHTML = `
        <div class="inc-icon">${escapeHtml(it.icon || '💰')}</div>
        <div class="inc-info">
          <div class="inc-name">${escapeHtml(it.name)}</div>
          <div class="inc-desc">${escapeHtml(it.desc || '')}</div>
        </div>
        <div class="inc-val">${escapeHtml(it.val || '')}</div>
        <button class="inc-del" data-id="${it.id}" title="删除">✕</button>
      `;
      listEl.appendChild(div);
    });
    // 汇总金额(提取数字)
    let total = 0;
    list.forEach(it => {
      const m = (it.val || '').match(/-?\d+(\.\d+)?/);
      if (m) total += parseFloat(m[0]);
    });
    $('#income-total').textContent = total > 0 ? `💰 月收入预估: ¥${total.toFixed(0)}` : '';
  }

  addBtn.addEventListener('click', () => {
    const name = $('#inc-name').value.trim();
    const desc = $('#inc-desc').value.trim();
    const val = $('#inc-val').value.trim();
    const icon = $('#inc-icon').value.trim() || '💰';
    if (!name) { showToast('请输入渠道名称'); return; }
    const list = Store.get(INC_KEY, []);
    list.push({ id: uid(), icon, name, desc, val });
    Store.set(INC_KEY, list);
    $('#inc-name').value = '';
    $('#inc-desc').value = '';
    $('#inc-val').value = '';
    $('#inc-icon').value = '';
    render();
    showToast('✅ 已添加收入渠道');
  });

  // 回车添加
  ['inc-name', 'inc-val'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') addBtn.click(); });
  });

  // 删除(事件委托)
  listEl.addEventListener('click', e => {
    const btn = e.target.closest('.inc-del');
    if (!btn) return;
    const id = btn.dataset.id;
    const list = Store.get(INC_KEY, []).filter(x => x.id !== id);
    Store.set(INC_KEY, list);
    render();
    showToast('已删除');
  });

  render();
}

if (typeof window !== 'undefined') {
  window.initMoney = initMoney;
  window.initIncomeChannels = initIncomeChannels;
}
