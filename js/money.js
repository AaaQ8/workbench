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

/* ===== 开店盈利评估 ===== */
function _shopVal(id) {
  const el = document.getElementById(id);
  return el ? parseFloat(el.value) || 0 : 0;
}

function initShopEval() {
  const calcBtn = $('#shop-calc');
  const resultEl = $('#shop-result');
  if (!calcBtn || !resultEl) return;

  // 地段客流系数(用于给出客流建议)
  const LOCATION_FACTOR = { '1': 1.5, '2': 1.0, '3': 0.8, '4': 0.5 };

  function calc() {
    const type = $('#shop-type').value;
    const loc = $('#shop-location').value;
    const rent = _shopVal('shop-rent');
    const salary = _shopVal('shop-salary');
    const util = _shopVal('shop-util');
    const invest = _shopVal('shop-invest');
    const price = _shopVal('shop-price');
    const traffic = _shopVal('shop-traffic');
    const margin = _shopVal('shop-margin') / 100;
    const days = _shopVal('shop-days') || 30;

    if (!price || !traffic || !margin) {
      showToast('请填写客单价、客流和毛利率');
      return;
    }

    const dailyRev = price * traffic;
    const monthlyRev = dailyRev * days;
    const monthlyGross = monthlyRev * margin;
    const monthlyFixed = rent + salary + util;
    const monthlyProfit = monthlyGross - monthlyFixed;
    const profitRate = monthlyRev > 0 ? (monthlyProfit / monthlyRev * 100) : 0;

    // 盈亏平衡:需要的日均客流
    const breakEvenDaily = monthlyFixed / (price * margin * days);
    // 回本周期(月)
    const paybackMonths = monthlyProfit > 0 ? (invest / monthlyProfit) : Infinity;

    // 地段建议客流(参考值)
    const suggestedTraffic = Math.round(80 * (LOCATION_FACTOR[loc] || 1));

    // 结论
    let conclusion, color, advice;
    if (monthlyProfit > 0 && paybackMonths <= 24) {
      conclusion = '✅ 值得开';
      color = 'var(--success)';
      advice = `月净利润 ¥${monthlyProfit.toFixed(0)},预计 ${paybackMonths.toFixed(1)} 个月回本,回本周期在 2 年内,风险可控。`;
    } else if (monthlyProfit > 0 && paybackMonths > 24) {
      conclusion = '⚠️ 谨慎考虑';
      color = 'var(--warning)';
      advice = `虽然盈利,但回本需 ${paybackMonths.toFixed(1)} 个月(超过 2 年),建议想办法降低初始投入或提升客流。`;
    } else if (monthlyProfit === 0) {
      conclusion = '➖ 持平';
      color = 'var(--text-secondary)';
      advice = '刚好盈亏平衡,没有利润空间,不建议开。';
    } else {
      conclusion = '❌ 不建议开';
      color = 'var(--danger)';
      advice = `每月亏损 ¥${Math.abs(monthlyProfit).toFixed(0)}。要盈利,日均客流至少需 ${Math.ceil(breakEvenDaily)} 人(当前 ${traffic} 人)。`;
    }

    // 地段提示
    let locTip = '';
    if (traffic < suggestedTraffic * 0.6) {
      locTip = `⚠️ 当前客流偏低,该地段参考客流约 ${suggestedTraffic} 人/天,建议重新评估选址或加强引流。`;
    } else if (traffic > suggestedTraffic * 1.3) {
      locTip = `💡 客流高于该地段平均水平,选址不错。`;
    }

    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div class="shop-conclusion" style="color:${color};">${conclusion}</div>
      <div class="shop-grid">
        <div class="shop-stat"><div class="ss-label">日营收</div><div class="ss-val">¥${dailyRev.toFixed(0)}</div></div>
        <div class="shop-stat"><div class="ss-label">月营收</div><div class="ss-val">¥${monthlyRev.toFixed(0)}</div></div>
        <div class="shop-stat"><div class="ss-label">月毛利</div><div class="ss-val">¥${monthlyGross.toFixed(0)}</div></div>
        <div class="shop-stat"><div class="ss-label">月固定成本</div><div class="ss-val">¥${monthlyFixed.toFixed(0)}</div></div>
        <div class="shop-stat"><div class="ss-label">月净利润</div><div class="ss-val" style="color:${monthlyProfit>=0?'var(--success)':'var(--danger)'}">¥${monthlyProfit.toFixed(0)}</div></div>
        <div class="shop-stat"><div class="ss-label">净利率</div><div class="ss-val">${profitRate.toFixed(1)}%</div></div>
        <div class="shop-stat"><div class="ss-label">盈亏平衡客流</div><div class="ss-val">${Math.ceil(breakEvenDaily)} 人/天</div></div>
        <div class="shop-stat"><div class="ss-label">回本周期</div><div class="ss-val">${isFinite(paybackMonths) ? paybackMonths.toFixed(1) + ' 个月' : '无法回本'}</div></div>
      </div>
      <div class="shop-advice">
        <p><b>分析建议:</b> ${advice}</p>
        ${locTip ? `<p>${locTip}</p>` : ''}
        <p style="color:var(--text-secondary);font-size:12px;">💡 提示:以上为静态估算,实际还需考虑竞争、淡旺季、损耗、营销费用等因素。建议先用保守客流(×0.7)再算一遍。</p>
      </div>
    `;
  }

  calcBtn.addEventListener('click', calc);
}

if (typeof window !== 'undefined') {
  window.initMoney = initMoney;
  window.initIncomeChannels = initIncomeChannels;
  window.initShopEval = initShopEval;
}
