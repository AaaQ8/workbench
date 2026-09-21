/* 美妆模块:今日妆容步骤打卡(localStorage 持久化,每日重置) */
function initMakeup() {
  const steps = $$('#panel-makeup .makeup-step');
  if (!steps.length) return;

  const today = new Date().toDateString();
  const saved = Store.get(Store.KEYS.TODAY, '') === today
    ? Store.get('pw_makeup_done', [])
    : [];

  function render() {
    steps.forEach((el, i) => {
      el.classList.toggle('done', saved.includes(i));
    });
  }

  steps.forEach((el, i) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      const idx = saved.indexOf(i);
      if (idx === -1) saved.push(i);
      else saved.splice(idx, 1);
      if (Store.get(Store.KEYS.TODAY, '') !== today) {
        Store.set(Store.KEYS.TODAY, today);
      }
      Store.set('pw_makeup_done', saved);
      render();
    });
  });

  render();
}

if (typeof window !== 'undefined') window.initMakeup = initMakeup;
