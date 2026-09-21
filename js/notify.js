/* 通用通知模块:优先系统通知(Notification API),降级为站内 toast
   让网页像 App 一样弹通知。需用户授权后才能弹系统通知。 */
const Notify = {
  enabled: true, // 总开关(用户可在设置里关)
  sound: true,   // 是否伴随提示音

  supported() {
    return typeof Notification !== 'undefined';
  },

  permission() {
    return this.supported() ? Notification.permission : 'unsupported';
  },

  // 请求通知权限,返回 Promise<boolean> 是否拿到授权
  async requestPermission() {
    if (!this.supported()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    try {
      const p = await Notification.requestPermission();
      return p === 'granted';
    } catch (e) { return false; }
  },

  // 弹一个通知:优先通过 Service Worker 弹系统通知(后台也能弹),失败走页面 Notification,再降级 toast
  // opts: { body, icon, tag, sound, onclick }
  push(title, opts) {
    opts = opts || {};
    // 站内 toast 始终弹一份(保证页面内可见)
    if (typeof showToast === 'function') {
      showToast(title + (opts.body ? ' · ' + opts.body : ''));
    }
    if (!this.enabled) return;
    // 声音
    if (opts.sound !== false && this.sound) this.beep();
    // 系统通知
    if (!this.supported() || Notification.permission !== 'granted') return;
    // 优先走 SW(后台标签页也能弹)
    if (this._swReg) {
      try {
        this._swReg.showNotification(title, {
          body: opts.body || '',
          icon: opts.icon || 'icons/icon-192.png',
          tag: opts.tag || '',
          silent: opts.sound === false
        });
        return;
      } catch (e) {}
    }
    // 降级:页面内 Notification
    try {
      const n = new Notification(title, {
        body: opts.body || '',
        icon: opts.icon || 'icons/icon-192.png',
        tag: opts.tag || '',
        silent: opts.sound === false ? true : false
      });
      n.onclick = () => {
        window.focus();
        if (opts.onclick) opts.onclick();
        n.close();
      };
      setTimeout(() => { try { n.close(); } catch (e) {} }, 8000);
    } catch (e) {}
  },

  // 短促提示音
  beep() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch (e) {}
  }
};

if (typeof window !== 'undefined') window.Notify = Notify;
