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
  { id: 'height',    label: '身高', opts: ['150以下', '150-158', '159-165', '166-170', '170以上'] },
  { id: 'body',      label: '体型', opts: ['梨形身材', '苹果型身材', 'H型身材', '沙漏型身材', '倒三角身材', '直筒型身材', '微胖身材', '偏瘦身材'] },
  { id: 'legs',      label: '腿型', opts: ['直腿', 'O型腿', 'X型腿', 'XO型腿', '小腿粗'] },
  { id: 'shoulder',  label: '肩型', opts: ['宽肩', '窄肩', '溜肩', '标准肩'] },
  { id: 'skin',      label: '肤色', opts: ['冷白皮', '暖黄皮', '自然肤色', '小麦色', '黄黑皮', '古铜色'] },
  { id: 'face',      label: '脸型', opts: ['圆脸', '方脸', '鹅蛋脸', '心形脸', '长脸', '菱形脸'] },
  { id: 'eyes',      label: '眼型', opts: ['单眼皮', '双眼皮', '内双', '丹凤眼', '圆眼', '细长眼'] },
  { id: 'skinType',  label: '肤质', opts: ['干皮', '油皮', '混合皮', '敏感肌', '中性皮'] },
  { id: 'hair',      label: '发质', opts: ['细软塌', '粗硬发', '自然卷', '发量少', '发量多'] },
  { id: 'style',     label: '风格', opts: ['通勤风', '甜酷风', '复古风', '温柔风', '极简风', '运动风', '韩系', '日系', '学院风', '辣妹风', '中性风'] },
  { id: 'colorPref', label: '配色', opts: ['黑白灰', '大地色', '莫兰迪色', '亮色系', '多巴胺', '奶油色系'] }
];

/* 身高 → 实际搜索词 */
const HEIGHT_KW = {
  '150以下': '150小个子穿搭',
  '150-158': '小个子穿搭',
  '159-165': '160女生穿搭',
  '166-170': '165女生穿搭',
  '170以上': '170高个子穿搭'
};

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
  if (p.height)   { const m = HEIGHT_KW[p.height]; if (m) outfitKws.push(m); }
  if (p.body)     outfitKws.push(p.body + '穿搭');
  if (p.legs)     outfitKws.push(p.legs + '适合的裤子');
  if (p.shoulder) outfitKws.push(p.shoulder + '穿搭');
  if (p.style)    outfitKws.push(p.style + '穿搭');
  if (p.colorPref) outfitKws.push(p.colorPref + '穿搭');
  if (p.skin)     outfitKws.push(p.skin + '穿搭显白');
  if (p.skinType) makeupKws.push(p.skinType + '护肤', p.skinType + '粉底');
  if (p.face)     makeupKws.push(p.face + '修容', p.face + '适合的发型');
  if (p.eyes)     makeupKws.push(p.eyes + '眼妆');
  if (p.hair)     makeupKws.push(p.hair + '发型');
  if (p.skin)     makeupKws.push(p.skin + '口红颜色');
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
  const clearBtn = $('#profile-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('清空所有已填特征?')) return;
      PROFILE_FIELDS.forEach(f => { const s = $('#profile-' + f.id); if (s) s.value = ''; });
      Store.set(Store.KEYS.BEAUTY_PROFILE, {});
      renderProfileLinks();
    });
  }
  renderProfileLinks();
}

if (typeof window !== 'undefined') window.initOutfit = initOutfit;

/* ============ 我的衣橱:按类别上传图片 + 自动排序 ============ */
const WD_CATEGORIES = ['衬衫', 'T恤', '裤装', '外套', '裙装', '鞋', '包', '其他'];
let _wdCurrentCat = '衬衫';

function _wdData() {
  return Store.get(Store.KEYS.WARDROBE, {}); // { 衬衫: [{id, name, data, ts}], ... }
}

function _wdRenderCatTabs() {
  const tabs = $('#wd-cat-tabs');
  if (!tabs) return;
  const data = _wdData();
  tabs.innerHTML = '';
  WD_CATEGORIES.forEach(cat => {
    const count = (data[cat] || []).length;
    const btn = document.createElement('button');
    btn.className = 'wd-cat-tab' + (cat === _wdCurrentCat ? ' active' : '');
    btn.dataset.cat = cat;
    btn.innerHTML = `${escapeHtml(cat)} <span class="wd-count">${count}</span>`;
    btn.addEventListener('click', () => {
      _wdCurrentCat = cat;
      _wdRenderCatTabs();
      _wdRenderGallery();
    });
    tabs.appendChild(btn);
  });
}

function _wdRenderGallery() {
  const gallery = $('#wd-gallery');
  if (!gallery) return;
  const data = _wdData();
  const items = (data[_wdCurrentCat] || []).slice().sort((a, b) => b.ts - a.ts); // 上传时间倒序
  gallery.innerHTML = '';
  if (!items.length) {
    gallery.innerHTML = '<div class="wd-empty">这个类别还没有图片,点上方「上传图片」添加吧~</div>';
    return;
  }
  items.forEach(it => {
    const card = document.createElement('div');
    card.className = 'wd-item';
    card.innerHTML = `
      <img src="${it.data}" alt="${escapeHtml(it.name)}" loading="lazy" />
      <div class="wd-item-meta">
        <span class="wd-item-name">${escapeHtml(it.name)}</span>
        <span class="wd-item-date">${new Date(it.ts).toLocaleDateString('zh-CN')}</span>
      </div>
      <button class="wd-item-del" data-id="${it.id}" title="删除">✕</button>
    `;
    gallery.appendChild(card);
  });
}

/* 图片压缩:用 canvas 缩到 maxW*maxH,JPEG 质量 0.7,避免 5MB 配额超限 */
function _wdCompress(file, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const maxW = 600, maxH = 800;
      let w = img.width, h = img.height;
      if (w > maxW) { h = h * maxW / w; w = maxW; }
      if (h > maxH) { w = w * maxH / h; h = maxH; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      cb(dataUrl);
    };
    img.onerror = () => cb(null);
    img.src = e.target.result;
  };
  reader.onerror = () => cb(null);
  reader.readAsDataURL(file);
}

function initWardrobe() {
  const uploadBtn = $('#wd-upload-btn');
  const fileInput = $('#wd-file');
  if (!uploadBtn || !fileInput) return;

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('只能上传图片文件~');
      fileInput.value = '';
      return;
    }
    _wdCompress(file, dataUrl => {
      fileInput.value = '';
      if (!dataUrl) { alert('图片处理失败,换个文件试试~'); return; }
      const data = _wdData();
      if (!data[_wdCurrentCat]) data[_wdCurrentCat] = [];
      data[_wdCurrentCat].push({
        id: uid(),
        name: file.name.length > 20 ? file.name.slice(0, 20) + '...' : file.name,
        data: dataUrl,
        ts: Date.now()
      });
      if (!Store.set(Store.KEYS.WARDROBE, data)) return;
      _wdRenderCatTabs();
      _wdRenderGallery();
      showToast('✅ 已添加到衣橱');
    });
  });

  const gallery = $('#wd-gallery');
  if (gallery) {
    gallery.addEventListener('click', e => {
      const btn = e.target.closest('.wd-item-del');
      if (!btn) return;
      const id = btn.dataset.id;
      if (!confirm('删除这张图?')) return;
      const data = _wdData();
      if (data[_wdCurrentCat]) {
        data[_wdCurrentCat] = data[_wdCurrentCat].filter(x => x.id !== id);
        Store.set(Store.KEYS.WARDROBE, data);
        _wdRenderCatTabs();
        _wdRenderGallery();
      }
    });
  }

  _wdRenderCatTabs();
  _wdRenderGallery();
}

if (typeof window !== 'undefined') window.initWardrobe = initWardrobe;
