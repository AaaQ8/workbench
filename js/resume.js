/* 简历模块:教育/工作/奖项/证书照片,纯 localStorage */
function _rsData() {
  return Store.get(Store.KEYS.RESUME, { edu: [], work: [], award: [], photos: [] });
}

function _rsSave(data) {
  return Store.set(Store.KEYS.RESUME, data);
}

function _rsItemHtml(it, kind) {
  if (kind === 'edu') {
    return `<div class="resume-item-head"><span class="resume-item-title">${escapeHtml(it.school || '')} · ${escapeHtml(it.major || '')}</span><button class="fav-delete rs-del" data-kind="edu" data-id="${it.id}">✕</button></div><span class="resume-item-time">${escapeHtml(it.time || '')}</span>`;
  }
  if (kind === 'work') {
    return `<div class="resume-item-head"><span class="resume-item-title">${escapeHtml(it.company || '')} · ${escapeHtml(it.position || '')}</span><button class="fav-delete rs-del" data-kind="work" data-id="${it.id}">✕</button></div><span class="resume-item-time">${escapeHtml(it.time || '')}</span>${it.desc ? `<div class="resume-item-desc">${escapeHtml(it.desc)}</div>` : ''}`;
  }
  if (kind === 'award') {
    return `<div class="resume-item-head"><span class="resume-item-title">🏆 ${escapeHtml(it.name || '')}</span><button class="fav-delete rs-del" data-kind="award" data-id="${it.id}">✕</button></div><span class="resume-item-time">${escapeHtml(it.time || '')}</span>`;
  }
  return '';
}

function _rsRender() {
  const data = _rsData();
  const eduBox = $('#rs-edu-list');
  const workBox = $('#rs-work-list');
  const awardBox = $('#rs-award-list');
  const photoBox = $('#rs-photo-list');

  if (eduBox) {
    eduBox.innerHTML = '';
    if (!data.edu.length) {
      eduBox.innerHTML = '<div class="note-item" style="opacity:.5;">还没有教育经历</div>';
    } else {
      data.edu.forEach(it => {
        const div = document.createElement('div');
        div.className = 'resume-item';
        div.innerHTML = _rsItemHtml(it, 'edu');
        eduBox.appendChild(div);
      });
    }
  }
  if (workBox) {
    workBox.innerHTML = '';
    if (!data.work.length) {
      workBox.innerHTML = '<div class="note-item" style="opacity:.5;">还没有实习/工作经历</div>';
    } else {
      data.work.forEach(it => {
        const div = document.createElement('div');
        div.className = 'resume-item';
        div.innerHTML = _rsItemHtml(it, 'work');
        workBox.appendChild(div);
      });
    }
  }
  if (awardBox) {
    awardBox.innerHTML = '';
    if (!data.award.length) {
      awardBox.innerHTML = '<div class="note-item" style="opacity:.5;">还没有奖项</div>';
    } else {
      data.award.forEach(it => {
        const div = document.createElement('div');
        div.className = 'resume-item';
        div.innerHTML = _rsItemHtml(it, 'award');
        awardBox.appendChild(div);
      });
    }
  }
  if (photoBox) {
    photoBox.innerHTML = '';
    if (!data.photos.length) {
      photoBox.innerHTML = '<div class="note-item" style="opacity:.5;grid-column:1/-1;">还没有照片</div>';
    } else {
      data.photos.forEach(p => {
        const div = document.createElement('div');
        div.className = 'resume-photo-item';
        div.innerHTML = `<img src="${p.data}" alt="${escapeHtml(p.name)}" /><button class="wd-item-del rs-photo-del" data-id="${p.id}">✕</button>`;
        photoBox.appendChild(div);
      });
    }
  }
}

/* 照片压缩(同衣橱) */
function _rsCompress(file, cb) {
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
      cb(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => cb(null);
    img.src = e.target.result;
  };
  reader.onerror = () => cb(null);
  reader.readAsDataURL(file);
}

function initResume() {
  // 教育添加
  const eduAdd = $('#rs-edu-add');
  if (eduAdd) {
    eduAdd.addEventListener('click', () => {
      const school = $('#rs-edu-school').value.trim();
      const major = $('#rs-edu-major').value.trim();
      const time = $('#rs-edu-time').value.trim();
      if (!school && !major) { alert('至少填学校或专业~'); return; }
      const data = _rsData();
      data.edu.unshift({ id: uid(), school, major, time, ts: Date.now() });
      if (!_rsSave(data)) return;
      $('#rs-edu-school').value = '';
      $('#rs-edu-major').value = '';
      $('#rs-edu-time').value = '';
      _rsRender();
    });
  }
  // 工作添加
  const workAdd = $('#rs-work-add');
  if (workAdd) {
    workAdd.addEventListener('click', () => {
      const company = $('#rs-work-company').value.trim();
      const position = $('#rs-work-position').value.trim();
      const time = $('#rs-work-time').value.trim();
      const desc = $('#rs-work-desc').value.trim();
      if (!company && !position) { alert('至少填公司或职位~'); return; }
      const data = _rsData();
      data.work.unshift({ id: uid(), company, position, time, desc, ts: Date.now() });
      if (!_rsSave(data)) return;
      $('#rs-work-company').value = '';
      $('#rs-work-position').value = '';
      $('#rs-work-time').value = '';
      $('#rs-work-desc').value = '';
      _rsRender();
    });
  }
  // 奖项添加
  const awardAdd = $('#rs-award-add');
  if (awardAdd) {
    awardAdd.addEventListener('click', () => {
      const name = $('#rs-award-name').value.trim();
      const time = $('#rs-award-time').value.trim();
      if (!name) { alert('填上奖项名称~'); return; }
      const data = _rsData();
      data.award.unshift({ id: uid(), name, time, ts: Date.now() });
      if (!_rsSave(data)) return;
      $('#rs-award-name').value = '';
      $('#rs-award-time').value = '';
      _rsRender();
    });
  }
  // 照片上传
  const photoBtn = $('#rs-photo-btn');
  const photoFile = $('#rs-photo-file');
  if (photoBtn && photoFile) {
    photoBtn.addEventListener('click', () => photoFile.click());
    photoFile.addEventListener('change', () => {
      const files = photoFile.files;
      if (!files || !files.length) return;
      const data = _rsData();
      let pending = files.length;
      const done = () => {
        if (--pending > 0) return;
        if (!_rsSave(data)) return;
        photoFile.value = '';
        _rsRender();
        showToast(`✅ 已上传 ${files.length} 张照片`);
      };
      Array.from(files).forEach(f => {
        if (!f.type.startsWith('image/')) { done(); return; }
        _rsCompress(f, dataUrl => {
          if (dataUrl) data.photos.push({ id: uid(), name: f.name, data: dataUrl, ts: Date.now() });
          done();
        });
      });
    });
  }
  // 删除(事件委托,父级监听)
  ['rs-edu-list', 'rs-work-list', 'rs-award-list', 'rs-photo-list'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', e => {
        const btn = e.target.closest('.rs-del, .rs-photo-del');
        if (!btn) return;
        const data = _rsData();
        if (btn.classList.contains('rs-del')) {
          const kind = btn.dataset.kind;
          const itemId = btn.dataset.id;
          if (!confirm('删除这一条?')) return;
          data[kind] = (data[kind] || []).filter(x => x.id !== itemId);
        } else if (btn.classList.contains('rs-photo-del')) {
          const itemId = btn.dataset.id;
          if (!confirm('删除这张照片?')) return;
          data.photos = (data.photos || []).filter(x => x.id !== itemId);
        }
        _rsSave(data);
        _rsRender();
      });
    }
  });

  _rsRender();
}

if (typeof window !== 'undefined') window.initResume = initResume;
