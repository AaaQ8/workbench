/* 唱歌模块:今日练声步骤打卡(localStorage 持久化,每日重置) */
const SING_STEPS = [
  { name: '气息练习', dur: '5min' },
  { name: '开嗓哼鸣', dur: '5min' },
  { name: '音阶琶音', dur: '10min' },
  { name: '歌曲片段', dur: '20min' },
  { name: '录音复盘', dur: '10min' }
];

function _singToday() {
  return new Date().toDateString();
}

function initSing() {
  const steps = $$('#panel-sing .sing-step');
  if (!steps.length) return;

  const today = _singToday();
  const saved = Store.get(Store.KEYS.TODAY, '') === today
    ? Store.get('pw_sing_done', [])
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
      // 重置日期
      if (Store.get(Store.KEYS.TODAY, '') !== today) {
        Store.set(Store.KEYS.TODAY, today);
      }
      Store.set('pw_sing_done', saved);
      render();
    });
  });

  render();
}

if (typeof window !== 'undefined') window.initSing = initSing;
