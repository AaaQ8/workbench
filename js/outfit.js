/* 穿搭:衣橱标签 → 记录本周每天穿了什么(localStorage 持久化) */
const OUTFIT_ITEMS = ['👚 衬衫', '👕 T恤', '👖 牛仔裤', '🧥 风衣', '👗 连衣裙', '👟 运动鞋', '👠 高跟鞋', '🎒 双肩包'];

function _outfitDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function _outfitWeekDates() {
  // 本周一到周日 7 个日期
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;  // 周一=0 ... 周日=6
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function loadOutfit() {
  const data = Store.get(Store.KEYS.OUTFIT_WEEK, {});
  const todayKey = _outfitDateKey(new Date());
  const dates = _outfitWeekDates();

  // 渲染一周记录
  $$('#week-outfit .week-day').forEach((cell, i) => {
    const key = _outfitDateKey(dates[i]);
    cell.classList.toggle('today', key === todayKey);
    const items = data[key] || [];
    const box = cell.querySelector('.wd-outfit');
    if (box) {
      box.textContent = items.length ? items.join(' ') : '—';
      box.style.color = items.length ? 'var(--accent)' : '';
    }
  });

  // 高亮今天已选中的标签
  const todayItems = data[todayKey] || [];
  $$('#outfit-tags .tag-item').forEach(tag => {
    tag.classList.toggle('active', todayItems.includes(tag.textContent.trim()));
  });
}

function initOutfit() {
  const tags = $('#outfit-tags');
  if (tags) {
    tags.addEventListener('click', e => {
      const tag = e.target.closest('.tag-item');
      if (!tag) return;
      const item = tag.textContent.trim();
      const data = Store.get(Store.KEYS.OUTFIT_WEEK, {});
      const key = _outfitDateKey(new Date());
      const items = data[key] || [];
      const idx = items.indexOf(item);
      if (idx === -1) items.push(item);
      else items.splice(idx, 1);
      data[key] = items;
      Store.set(Store.KEYS.OUTFIT_WEEK, data);
      loadOutfit();
    });
  }

  // 点击某一天清空当天记录
  const week = $('#week-outfit');
  if (week) {
    week.addEventListener('click', e => {
      const cell = e.target.closest('.week-day');
      if (!cell) return;
      const i = parseInt(cell.dataset.day);
      const dates = _outfitWeekDates();
      const key = _outfitDateKey(dates[i]);
      const data = Store.get(Store.KEYS.OUTFIT_WEEK, {});
      if (data[key] && data[key].length) {
        delete data[key];
        Store.set(Store.KEYS.OUTFIT_WEEK, data);
      }
      loadOutfit();
    });
  }

  loadOutfit();
}

if (typeof window !== 'undefined') window.initOutfit = initOutfit;
