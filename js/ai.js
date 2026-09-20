function initAIAssistant() {
  const el       = $('#ai-assistant');
  const header   = $('#ai-header');
  const input    = $('#ai-input');
  const sendBtn  = $('#ai-send');
  const minBtn   = $('#ai-minimize');
  const box      = $('#ai-messages');

  if (!el) return;

  if (minBtn) {
    minBtn.addEventListener('click', () => {
      el.classList.toggle('minimized');
      minBtn.textContent = el.classList.contains('minimized') ? '+' : '—';
    });
  }

  if (sendBtn) sendBtn.addEventListener('click', aiSend);
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') aiSend();
    });
  }

  let dragging = false, startX, startY, origX, origY;
  if (header) {
    header.addEventListener('mousedown', e => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      origX = rect.left;
      origY = rect.top;
      e.preventDefault();
    });
  }

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newX = origX + dx;
    const newY = origY + dy;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.left = Math.max(0, Math.min(newX, window.innerWidth - el.offsetWidth)) + 'px';
    el.style.top  = Math.max(0, Math.min(newY, window.innerHeight - el.offsetHeight)) + 'px';
  });

  document.addEventListener('mouseup', () => { dragging = false; });
}

function aiSend() {
  const input = $('#ai-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  addAIMessage('user', text);
  input.value = '';
  setTimeout(() => handleAIResponse(text), 250);
}

function addAIMessage(type, text) {
  const box = $('#ai-messages');
  if (!box) return;
  const div = document.createElement('div');
  div.className = 'ai-msg ' + (type === 'user' ? 'ai-user' : 'ai-bot');
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function handleAIResponse(input) {
  const cmd = input.toLowerCase();

  if (/新任务|加任务|todo|待办|加个任务/.test(cmd)) {
    return addAIMessage('bot', '好的,去首页「今日待办」里输入文字然后点「添加」就可以啦 ✏️');
  }

  if (/新目标|加目标|目标/.test(cmd)) {
    return addAIMessage('bot', '去「目标管理」页添加你的年度或短期目标吧 🎯');
  }

  if (/今日|今天|我的任务|我的待办/.test(cmd)) {
    const todos = Store.get(Store.KEYS.TODOS, []);
    const pending = todos.filter(t => !t.done);
    const done = todos.filter(t => t.done);
    return addAIMessage('bot',
      `📋 今日待办:待完成 ${pending.length} 项,已完成 ${done.length} 项。加油!💪`);
  }

  if (/统计|数据|概览|进度/.test(cmd)) {
    const tasks = Store.get(Store.KEYS.TODOS, []);
    const totalFocus = Store.get(Store.KEYS.FOCUS_TOTAL, 0);
    const notes = Store.get(Store.KEYS.NOTES, []).length;
    return addAIMessage('bot',
      `📊 你的数据概览:\n` +
      `• 已完成任务:${tasks.filter(t => t.done).length}\n` +
      `• 累计专注:${totalFocus} 分钟\n` +
      `• 笔记数:${notes}`
    );
  }

  if (/成就|勋章|奖杯/.test(cmd)) {
    const unlocked = Object.keys(Store.get(Store.KEYS.ACHIEVEMENTS, {})).length;
    return addAIMessage('bot', `🏆 你已解锁 ${unlocked} 个成就,继续加油!`);
  }

  if (/专注|番茄|计时/.test(cmd)) {
    const total = Store.get(Store.KEYS.FOCUS_TOTAL, 0);
    const today = Store.get(Store.KEYS.FOCUS_TODAY, 0);
    return addAIMessage('bot', `🧘 今日已专注 ${today} 分钟,累计 ${total} 分钟。去「专注」页面开启计时吧!`);
  }

  if (/加油|鼓励|emo|难|累|help/.test(cmd)) {
    const quotes = [
      '🌟 每天进步一点点,终将改变全世界!',
      '💪 你比昨天更强了,继续保持!',
      '🌱 种一棵树最好的时间是十年前,其次是现在。',
      '🚀 优秀不是一种行为,而是一种习惯。',
      '✨ 专注当下,未来可期。',
      '💫 别怕路长,怕的是你不敢迈出第一步。',
      '🔥 你已经做得比大多数人都好了,给自己一些肯定吧!'
    ];
    return addAIMessage('bot', quotes[Math.floor(Math.random() * quotes.length)]);
  }

  if (/笑话|讲个笑话|开心一下/.test(cmd)) {
    const jokes = [
      '🤣 程序员最怕的不是 Bug,是产品经理说:「这个需求很简单」。',
      '😄 有个 AI 去面试,面试官问:「你最大的缺点是什么?」AI 答:「我太诚实了。」面试官:「诚实不算缺点吧?」AI:「我不在乎你怎么想。」',
      '😆 为什么程序员分不清万圣节和圣诞节?因为 Oct 31 == Dec 25。',
      '😂 一只企鹅走进餐厅,点了杯咖啡,对服务员说:「不要冰,我是企鹅。」服务员:「那你直接去冰箱里喝啊!」',
      '🤣 有人说:「早起的鸟儿有虫吃。」我:「早起的虫儿被鸟吃,所以我选择当虫儿睡懒觉。」'
    ];
    return addAIMessage('bot', jokes[Math.floor(Math.random() * jokes.length)]);
  }

  if (/记账|消费|支出|收入/.test(cmd)) {
    return addAIMessage('bot', '去「财务管理」页可以快速记账 📒,支持收入/支出和分类统计哦!');
  }

  if (/赚钱|副业|收入渠道|搞钱/.test(cmd)) {
    return addAIMessage('bot', '💡 去「赚钱」页面看看你的收入渠道和灵感吧。另外,你也可以告诉我你擅长什么,我帮你出出主意~');
  }

  if (/学习|学什么|推荐学习/.test(cmd)) {
    return addAIMessage('bot',
      '📚 学习的方向有很多:\n' +
      '• 📖 去「学习」页面制定学习计划\n' +
      '• 🔤 去「英语」页面打卡\n' +
      '• 🤖 去「AI学习」页面记录 AI 笔记\n' +
      '你现在最想学什么呢?'
    );
  }

  if (/帮助|help|怎么用|指令/.test(cmd)) {
    return addAIMessage('bot',
      '🤖 我可以帮你做这些:\n' +
      '• 说「今日」查看待办\n' +
      '• 说「统计」查看数据\n' +
      '• 说「专注」查看专注情况\n' +
      '• 说「成就」查看已解锁\n' +
      '• 说「加油」获得鼓励\n' +
      '• 说「笑话」听个段子\n' +
      '• 说「记账」「赚钱」「学习」获取指引\n' +
      '• 说「新任务」「新目标」快速跳转'
    );
  }

  const replies = [
    '嗯呢,我在听 👂',
    '有意思,说说看 🤔',
    '明白啦,还需要什么帮忙吗?',
    '好的~ 有任何问题随时叫我 💬',
    '收到!还有别的事吗?',
    '这话题不错,想深入聊聊吗?',
    '我记下了,有什么我能帮上忙的尽管说 ✨'
  ];
  addAIMessage('bot', replies[Math.floor(Math.random() * replies.length)]);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAIAssistant);
} else {
  initAIAssistant();
}
