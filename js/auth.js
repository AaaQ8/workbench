/* ===== 访问密码保护 =====
 * 密码只存在本设备(localStorage),用简单哈希防小白直读
 * 开启后每次打开需输入密码,输错无法使用
 */
(function () {
  const PWD_KEY = 'pw_access_pwd';   // 哈希后的密码
  const ON_KEY = 'pw_access_on';     // 是否开启(true/false)
  const SESSION_KEY = 'pw_auth_ok';  // 本次会话已通过

  // 简单哈希(非加密,仅防明文直读)
  function _hash(s) {
    s = String(s || '');
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    // 再混淆一次
    return btoa(String(h) + ':' + s.length + ':' + (s.split('').reduce((a, c) => a + c.charCodeAt(0), 0)));
  }

  const Auth = {
    isEnabled() {
      try { return Store.get(ON_KEY, false) === true && !!Store.get(PWD_KEY, ''); }
      catch (e) { return false; }
    },
    isAuthed() {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    },
    verify(pwd) {
      const saved = Store.get(PWD_KEY, '');
      if (!saved) return false;
      return _hash(pwd) === saved;
    },
    setPassword(pwd) {
      if (!pwd || !pwd.trim()) {
        // 关闭密码
        Store.set(ON_KEY, false);
        Store.set(PWD_KEY, '');
        return true;
      }
      Store.set(PWD_KEY, _hash(pwd));
      Store.set(ON_KEY, true);
      sessionStorage.setItem(SESSION_KEY, '1');
      return true;
    },
    markAuthed() {
      sessionStorage.setItem(SESSION_KEY, '1');
    },
    // 显示密码遮罩,通过后才放行
    requireAuth(onPass) {
      if (!this.isEnabled() || this.isAuthed()) {
        if (typeof onPass === 'function') onPass();
        return;
      }
      // 创建遮罩
      const mask = document.createElement('div');
      mask.id = 'auth-mask';
      mask.innerHTML = `
        <div class="auth-box">
          <div class="auth-icon">🔐</div>
          <div class="auth-title">请输入访问密码</div>
          <input type="password" id="auth-input" placeholder="请输入密码" autocomplete="off" />
          <div class="auth-err" id="auth-err"></div>
          <button id="auth-btn" class="btn-primary">解锁</button>
        </div>
      `;
      document.body.appendChild(mask);
      const input = mask.querySelector('#auth-input');
      const btn = mask.querySelector('#auth-btn');
      const err = mask.querySelector('#auth-err');
      input.focus();
      const tryUnlock = () => {
        if (Auth.verify(input.value)) {
          Auth.markAuthed();
          mask.remove();
          if (typeof onPass === 'function') onPass();
        } else {
          err.textContent = '密码错误,请重试';
          input.value = '';
          input.focus();
        }
      };
      btn.addEventListener('click', tryUnlock);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
    }
  };

  window.Auth = Auth;
})();
