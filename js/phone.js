/* 手机内容导入:通过文件选择器把照片/文本文档导入工作台本地保存
   说明:出于浏览器隐私沙箱限制,只能读取用户手动选择的文件,无法扫描整个手机 */
function renderPhoneFiles() {
  const ul = $('#phone-list');
  if (!ul) return;
  const stBox = $('#phone-storage');
  if (stBox) {
    const used = Store.usage();
    stBox.textContent = used >= 0 ? `💾 存储空间已用约 ${(used / 1024 / 1024).toFixed(1)} MB(上限约 5 MB,照片最占空间)` : '';
  }
  const list = Store.get(Store.KEYS.PHONE_FILES, []);
  ul.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.textContent = '还没有导入内容,点上方按钮从手机选照片或文档~';
    ul.appendChild(li);
    return;
  }
  list.forEach(item => {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.innerHTML = `
      ${item.kind === 'image'
        ? `<img src="${item.data}" style="max-width:100%;max-height:90px;border-radius:8px;margin:6px 0;" alt="${escapeHtml(item.name)}"/>`
        : '<div style="font-size:20px;line-height:1.2;">📄</div>'}
      <div class="note-title" style="flex:1;min-width:0;word-break:break-all;">${item.kind === 'image' ? '🖼️' : '📄'} ${escapeHtml(item.name)}</div>
      <button class="fav-delete phone-del" data-id="${item.id}" title="删除">✕</button>
      ${item.text ? '<div class="phone-text" style="display:none;white-space:pre-wrap;font-size:12px;color:var(--text-secondary);max-height:150px;overflow:auto;width:100%;"></div>' : ''}
    `;
    if (item.text) {
      const box = li.querySelector('.phone-text');
      box.textContent = item.text.slice(0, 4000);
      li.querySelector('.note-title').addEventListener('click', () => {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
      });
    }
    ul.appendChild(li);
  });
}

function _compressImage(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const max = 720;
      let w = img.width, h = img.height;
      if (w > max || h > max) {
        const r = Math.min(max / w, max / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function _readFileAs(fn, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    fn(reader, file);
  });
}

function initPhone() {
  const trigger = $('#phone-import');
  const input = $('#phone-files');
  if (!trigger || !input) return;

  const ul = $('#phone-list');
  if (ul) {
    ul.addEventListener('click', e => {
      if (e.target.classList.contains('phone-del')) {
        const id = e.target.dataset.id;
        Store.set(Store.KEYS.PHONE_FILES, Store.get(Store.KEYS.PHONE_FILES, []).filter(x => x.id !== id));
        renderPhoneFiles();
      }
    });
  }

  trigger.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    const list = Store.get(Store.KEYS.PHONE_FILES, []);
    let added = 0;
    let skipped = 0;
    for (const f of files) {
      try {
        if (f.type.startsWith('image/')) {
          const raw = await _readFileAs((r) => r.readAsDataURL(f), f);
          const data = await _compressImage(raw);
          list.unshift({ id: uid(), name: f.name, kind: 'image', data, createdAt: Date.now() });
          added++;
        } else if (/\.(txt|md|csv|json)$/i.test(f.name) || f.type.startsWith('text/')) {
          const text = await _readFileAs((r) => r.readAsText(f), f);
          list.unshift({ id: uid(), name: f.name, kind: 'text', text, createdAt: Date.now() });
          added++;
        } else {
          skipped++;
        }
      } catch (err) {
        skipped++;
      }
    }
    const msg = $('#phone-msg');
    const ok = Store.set(Store.KEYS.PHONE_FILES, list);
    if (ok) {
      if (msg) {
        msg.textContent = added ? `已导入 ${added} 项${skipped ? `,跳过 ${skipped} 项` : ''}` : '没有可支持的文件类型';
        setTimeout(() => { msg.textContent = ''; }, 3000);
      }
    } else if (msg) {
      msg.textContent = '空间不足,没有保存!';
    }
    input.value = '';
    renderPhoneFiles();
  });

  renderPhoneFiles();
}

if (typeof window !== 'undefined') window.initPhone = initPhone;
