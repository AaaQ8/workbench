function loadFinance() {
  const list = Store.get(Store.KEYS.FINANCE, []).slice().sort((a, b) => {
    const da = new Date(a.date || a.createdAt).getTime();
    const db = new Date(b.date || b.createdAt).getTime();
    return db - da;
  });
  const ul = $('#fin-list');
  if (!ul) return;
  ul.innerHTML = '';
  list.forEach(f => {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.innerHTML = `
      <div class="note-title">${f.type === 'income' ? '📥 ' : '📤 '}${escapeHtml(f.category || '未分类')}</div>
      <div class="note-preview" style="color:${f.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${f.type === 'income' ? '+' : '-'}¥${f.amount.toFixed(2)}</div>
      <div class="note-date">${f.date || formatDate(f.createdAt)}</div>
      <button class="fin-delete" data-id="${f.id}" title="删除">✕</button>
    `;
    ul.appendChild(li);
  });
  updateFinanceStats();
  renderFinanceCharts();
}

/* ---------- 图表(Chart.js) ---------- */
let finCatChart = null;
let finTrendChart = null;

function chartTheme() {
  const css = getComputedStyle(document.documentElement);
  return {
    text: css.getPropertyValue('--text-secondary').trim() || '#9a9aa6',
    border: css.getPropertyValue('--border').trim() || '#2a2a33',
    accent: css.getPropertyValue('--accent').trim() || '#ff6b35'
  };
}

function renderFinanceCharts() {
  if (typeof Chart === 'undefined') return;
  const c = chartTheme();
  Chart.defaults.color = c.text;
  Chart.defaults.borderColor = c.border;
  const list = Store.get(Store.KEYS.FINANCE, []);
  const now = new Date();

  // 环形图:本月支出分类占比
  const monthExp = list.filter(f => {
    if (f.type !== 'expense') return false;
    const d = new Date(f.date || f.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const byCat = {};
  monthExp.forEach(f => {
    const k = f.category || '未分类';
    byCat[k] = (byCat[k] || 0) + f.amount;
  });
  const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, 7);
  const rest = entries.slice(7).reduce((s, e) => s + e[1], 0);
  if (rest > 0) top.push(['其他', rest]);

  const catCanvas = $('#fin-cat-chart');
  if (catCanvas) {
    if (finCatChart) finCatChart.destroy();
    finCatChart = new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: top.length ? top.map(e => e[0]) : ['暂无支出'],
        datasets: [{
          data: top.length ? top.map(e => +e[1].toFixed(2)) : [1],
          backgroundColor: [c.accent, '#4ade80', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa', '#34d399', '#9a9aa6'],
          borderWidth: 0
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' } }
      }
    });
  }

  // 折线图:最近 14 天收支走势
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(formatDate(d.getTime()));
  }
  const expByDay = {}, incByDay = {};
  days.forEach(d => { expByDay[d] = 0; incByDay[d] = 0; });
  list.forEach(f => {
    const d = f.date || formatDate(f.createdAt);
    if (d in expByDay) {
      if (f.type === 'expense') expByDay[d] += f.amount;
      else incByDay[d] += f.amount;
    }
  });
  const trendCanvas = $('#fin-trend-chart');
  if (trendCanvas) {
    if (finTrendChart) finTrendChart.destroy();
    finTrendChart = new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels: days.map(d => d.slice(5)),
        datasets: [
          {
            label: '支出',
            data: days.map(d => +expByDay[d].toFixed(2)),
            borderColor: '#e64747',
            backgroundColor: 'rgba(230,71,71,.15)',
            tension: 0.35,
            fill: true,
            pointRadius: 2
          },
          {
            label: '收入',
            data: days.map(d => +incByDay[d].toFixed(2)),
            borderColor: c.accent,
            backgroundColor: 'rgba(255,107,53,.15)',
            tension: 0.35,
            fill: true,
            pointRadius: 2
          }
        ]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

function updateFinanceStats() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const list = Store.get(Store.KEYS.FINANCE, []);
  const monthList = list.filter(f => {
    const d = new Date(f.date || f.createdAt);
    return d.getFullYear() === y && d.getMonth() === m;
  });
  const income = monthList.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0);
  const expense = monthList.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0);
  const balance = income - expense;
  const saveRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const el = id => $('#' + id);
  if (el('fin-income')) el('fin-income').textContent = '¥' + income.toFixed(2);
  if (el('fin-expense')) el('fin-expense').textContent = '¥' + expense.toFixed(2);
  if (el('fin-balance')) el('fin-balance').textContent = '¥' + balance.toFixed(2);
  if (el('fin-save-rate')) el('fin-save-rate').textContent = saveRate + '%';
}

function initFinance() {
  const add = $('#fin-add');
  if (!add) return;
  const today = new Date().toISOString().split('T')[0];
  const dateInput = $('#fin-date');
  if (dateInput && !dateInput.value) dateInput.value = today;

  add.addEventListener('click', () => {
    const type = $('#fin-type').value;
    const amount = parseFloat($('#fin-amount').value);
    const category = $('#fin-cat').value.trim();
    const date = $('#fin-date').value || today;
    if (!amount || amount <= 0) {
      alert('请输入有效的金额');
      return;
    }
    const list = Store.get(Store.KEYS.FINANCE, []);
    list.unshift({ id: uid(), type, amount, category, date, createdAt: Date.now() });
    Store.set(Store.KEYS.FINANCE, list);
    $('#fin-amount').value = '';
    $('#fin-cat').value = '';
    loadFinance();
  });

  const ul = $('#fin-list');
  if (ul) {
    ul.addEventListener('click', e => {
      if (e.target.classList.contains('fin-delete')) {
        const id = e.target.dataset.id;
        const list = Store.get(Store.KEYS.FINANCE, []).filter(f => f.id !== id);
        Store.set(Store.KEYS.FINANCE, list);
        loadFinance();
      }
    });
  }

  loadFinance();
}
