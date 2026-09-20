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
  initProfile();
}

/* ============ 我的特征档案 → 生成定制穿搭/美妆视频搜索 ============ */
const PROFILE_FIELDS = [
  { id: 'body',     label: '体型', opts: ['梨形身材', '苹果型身材', 'H型身材', '沙漏型身材', '倒三角身材', '直筒型身材'] },
  { id: 'skin',     label: '肤色', opts: ['冷白皮', '暖黄皮', '自然肤色', '小麦色', '黄黑皮'] },
  { id: 'style',    label: '风格', opts: ['通勤风', '甜酷风', '复古风', '温柔风', '极简风', '运动风'] },
  { id: 'face',     label: '脸型', opts: ['圆脸', '方脸', '鹅蛋脸', '心形脸', '长脸'] },
  { id: 'skinType', label: '肤质', opts: ['干皮', '油皮', '混合皮', '敏感肌'] }
];

function _profileSearchHtml(kw) {
  const enc = encodeURIComponent(kw);
  return `
    <a class="resource-item" href="https://www.douyin.com/search/${enc}?type=video" target="_blank" rel="noopener">
      <div class="resource-icon">📱</div>
      <div>
        <div class="resource-title">抖音 · ${escapeHtml(kw)}</div>
        <div class="resource-desc">短视频搜索(手机跳转App)</div>
      </div>
    </a>
    <a class="resource-item" href="https://search.bilibili.com/all?keyword=${enc}" target="_blank" rel="noopener">
      <div class="resource-icon">📺</div>
      <div>
        <div class="resource-title">B站 · ${escapeHtml(kw)}</div>
        <div class="resource-desc">长视频教学更系统</div>
      </div>
    </a>`;
}

function _profileKeywords() {
  const p = Store.get(Store.KEYS.BEAUTY_PROFILE, {});
  const outfitKws = [];
  const makeupKws = [];
  if (p.body)  outfitKws.push(p.body + '穿搭');
  if (p.style) outfitKws.push(p.style + '穿搭');
  if (p.skin)  outfitKws.push(p.skin + '穿搭显白');
  if (p.skinType) makeupKws.push(p.skinType + '护肤', p.skinType + '粉底');
  if (p.face)  makeupKws.push(p.face + '修容', p.face + '适合的发型');
  if (p.skin)  makeupKws.push(p.skin + '口红颜色');
  return {
    outfit: [...new Set(outfitKws.filter(Boolean))],
    makeup: [...new Set(makeupKws.filter(Boolean))]
  };
}

function renderProfileLinks() {
  const kws = _profileKeywords();
  const outfitBox = $('#profile-links');
  const makeupBox = $('#makeup-profile-links');
  if (outfitBox) {
    outfitBox.innerHTML = kws.outfit.length
      ? kws.outfit.map(_profileSearchHtml).join('')
      : '<div class="note-item">还没保存特征,先在上方选择并保存,这里会生成你的专属穿搭视频入口~</div>';
  }
  if (makeupBox) {
    makeupBox.innerHTML = kws.makeup.length
      ? kws.makeup.map(_profileSearchHtml).join('')
      : '<div class="note-item">去「穿搭 → 我的特征档案」保存肤质/脸型,这里就会生成专属美妆教程入口~</div>';
  }
}

function initProfile() {
  const form = $('#profile-form');
  if (!form) return;
  const saved = Store.get(Store.KEYS.BEAUTY_PROFILE, {});
  form.innerHTML = PROFILE_FIELDS.map(f => `
    <div class="setting-row">
      <label>${f.label}:</label>
      <select id="profile-${f.id}" style="flex:1;">
        <option value="">未设置</option>
        ${f.opts.map(o => `<option value="${o}"${saved[f.id] === o ? ' selected' : ''}>${o}</option>`).join('')}
      </select>
    </div>`).join('');
  $('#profile-save').addEventListener('click', () => {
    const data = {};
    PROFILE_FIELDS.forEach(f => {
      const v = $('#profile-' + f.id).value;
      if (v) data[f.id] = v;
    });
    if (!Object.keys(data).length) {
      $('#profile-msg').textContent = '至少选一项再保存~';
      return;
    }
    Store.set(Store.KEYS.BEAUTY_PROFILE, data);
    $('#profile-msg').textContent = '已保存 ✓';
    setTimeout(() => { $('#profile-msg').textContent = ''; }, 1500);
    renderProfileLinks();
  });
  renderProfileLinks();
}

if (typeof window !== 'undefined') window.initOutfit = initOutfit;
