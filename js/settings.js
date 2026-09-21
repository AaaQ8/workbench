function initSettings() {
  // 通知设置
  const notifyStatus = $('#notify-status');
  const notifyToggle = $('#notify-toggle');
  const soundToggle = $('#notify-sound-toggle');

  function refreshNotifyUI() {
    if (typeof Notify === 'undefined') return;
    const perm = Notify.permission();
    if (notifyStatus) {
      notifyStatus.textContent = perm === 'granted' ? '已授权 ✅'
        : perm === 'denied' ? '已拒绝 🔕(去浏览器设置里允许)'
        : perm === 'unsupported' ? '浏览器不支持' : '未授权';
    }
    if (notifyToggle) {
      notifyToggle.textContent = perm === 'granted' ? '测试通知' : '开启通知';
    }
    if (soundToggle) {
      soundToggle.textContent = '声音:' + (Notify.sound ? '开' : '关');
    }
  }

  if (notifyToggle) {
    notifyToggle.addEventListener('click', async () => {
      if (typeof Notify === 'undefined') return;
      if (Notify.permission() === 'granted') {
        Notify.push('🔔 通知测试', { body: '通知已正常工作!' });
        return;
      }
      const ok = await Notify.requestPermission();
      if (ok) {
        Notify.push('🔔 通知已开启', { body: '专注完成、任务到点会弹通知' });
      } else {
        alert('未获得通知授权,可在浏览器地址栏的站点设置里手动允许通知');
      }
      refreshNotifyUI();
    });
  }
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      if (typeof Notify === 'undefined') return;
      Notify.sound = !Notify.sound;
      Store.set('pw_notify_sound', Notify.sound);
      refreshNotifyUI();
      if (Notify.sound) Notify.beep();
    });
  }
  // 恢复声音偏好
  if (typeof Notify !== 'undefined') {
    const s = Store.get('pw_notify_sound', null);
    if (s !== null) Notify.sound = !!s;
  }
  refreshNotifyUI();

  const cdName = $('#set-cd-name');
  const cdDate = $('#set-cd-date');
  const cdSave = $('#save-countdown');
  const themeColor = $('#theme-color');
  const themeSave = $('#save-theme');
  const exportBtn = $('#export-data');
  const triggerImport = $('#trigger-import');
  const importInput = $('#import-data');
  const clearBtn = $('#clear-data');

  // 倒计时
  const cd = Store.get(Store.KEYS.COUNTDOWN, { name: '', date: null });
  if (cd.name && cdName) cdName.value = cd.name;
  if (cd.date && cdDate) cdDate.value = cd.date;

  if (cdSave) {
    cdSave.addEventListener('click', () => {
      const name = cdName ? cdName.value.trim() : '';
      const date = cdDate ? cdDate.value : '';
      if (!date) {
        alert('请选择目标日期!');
        return;
      }
      Store.set(Store.KEYS.COUNTDOWN, { name, date });
      alert('⏳ 倒计时设置已保存!');
    });
  }

  // 主题
  const savedTheme = Store.get(Store.KEYS.THEME, null);
  if (savedTheme) {
    document.documentElement.style.setProperty('--accent', savedTheme);
    if (themeColor) themeColor.value = savedTheme;
  }

  if (themeSave && themeColor) {
    themeSave.addEventListener('click', () => {
      const color = themeColor.value;
      document.documentElement.style.setProperty('--accent', color);
      Store.set(Store.KEYS.THEME, color);
      alert('🎨 主题色已应用!');
    });
  }

  // 导出
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([Store.export()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `个人工作台_${formatDate(Date.now())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // 导入
  if (triggerImport && importInput) {
    triggerImport.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          Store.import(reader.result);
          alert('✅ 数据导入成功!刷新页面后生效');
        } catch (err) {
          alert('❌ 文件格式错误,无法导入');
        }
      };
      reader.readAsText(file);
      importInput.value = '';
    });
  }

  // 清空
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('⚠️ 确定要清空所有数据吗?此操作不可恢复!')) return;
      if (!confirm('⚠️ 再次确认:真的要清空吗?所有任务、笔记、设置都会消失!')) return;
      Store.clear();
      alert('已清空所有数据,刷新页面');
      location.reload();
    });
  }
  // 手机访问二维码
  const qrBox = $('#phone-qr');
  const qrTip = $('#phone-qr-tip');
  const phoneUrl = $('#phone-url');
  if (qrBox && phoneUrl) {
    if ((location.protocol === 'http:' || location.protocol === 'https:') && !phoneUrl.value) {
      phoneUrl.value = location.origin + location.pathname;
    }
    const renderQR = () => {
      const u = phoneUrl.value.trim();
      qrBox.innerHTML = '';
      if (qrTip) qrTip.textContent = '';
      if (!u) {
        qrBox.innerHTML = '<span style="color:#333;font-size:12px;">请先运行「启动手机访问.bat」</span>';
        return;
      }
      if (/localhost|127\.0\.0\.1/.test(u) && qrTip) {
        qrTip.textContent = '⚠️ 这是本机地址,手机打不开;请用「启动手机访问.bat」窗口里显示的内网地址(192.168 或 10. 开头)';
      }
      if (typeof qrcode !== 'function') {
        qrBox.innerHTML = '<span style="color:#333;font-size:12px;">二维码组件加载失败</span>';
        return;
      }
      try {
        const qr = qrcode(0, 'M');
        qr.addData(u);
        qr.make();
        qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      } catch (e) {
        qrBox.innerHTML = '<span style="color:#333;font-size:12px;">地址过长,无法生成二维码</span>';
      }
    };
    renderQR();
    phoneUrl.addEventListener('change', renderQR);
    const regenBtn = $('#phone-qr-regen');
    if (regenBtn) regenBtn.addEventListener('click', renderQR);
    const copyBtn = $('#phone-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const u = phoneUrl.value.trim();
        if (!u) return;
        const done = () => alert('✅ 地址已复制:' + u);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(u).then(done).catch(() => {});
        } else {
          const ta = document.createElement('textarea');
          ta.value = u;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          done();
        }
      });
    }
  }

  // 访问密码设置
  const pwdStatus = $('#pwd-status');
  const pwdNew = $('#pwd-new');
  const pwdConfirm = $('#pwd-confirm');
  const savePwdBtn = $('#save-pwd');

  function refreshPwdUI() {
    if (!pwdStatus) return;
    if (typeof Auth !== 'undefined' && Auth.isEnabled && Auth.isEnabled()) {
      pwdStatus.textContent = '已开启 🔒';
      pwdStatus.style.color = 'var(--accent)';
    } else {
      pwdStatus.textContent = '未设置';
      pwdStatus.style.color = 'var(--text-secondary)';
    }
  }
  refreshPwdUI();

  if (savePwdBtn && typeof Auth !== 'undefined') {
    savePwdBtn.addEventListener('click', () => {
      const v1 = pwdNew ? pwdNew.value : '';
      const v2 = pwdConfirm ? pwdConfirm.value : '';
      if (v1 !== v2) { showToast('两次输入的密码不一致'); return; }
      if (v1 && v1.length < 4) { showToast('密码至少 4 位'); return; }
      Auth.setPassword(v1);
      if (pwdNew) pwdNew.value = '';
      if (pwdConfirm) pwdConfirm.value = '';
      refreshPwdUI();
      showToast(v1 ? '✅ 密码已设置,下次打开需输入' : '✅ 已关闭密码');
    });
  }
}

if (typeof window !== 'undefined') window.initSettings = initSettings;
