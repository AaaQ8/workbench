const STUDY_KEY = 'pw_study_plan';

function loadStudyPlan() {
  const list = Store.get(STUDY_KEY, []);
  const ul = $('#study-list');
  if (!ul) return;
  ul.innerHTML = '';
  if (list.length === 0) {
    ul.innerHTML = '<li style="color:#999;padding:8px 12px;">暂无学习计划,添加一个吧!</li>';
    return;
  }
  list.forEach(item => {
    const li = document.createElement('li');
    li.className = 'goal-item';
    li.innerHTML = `
      <span class="goal-text">📚 ${escapeHtml(item.subject)}</span>
      <span class="goal-deadline">⏱️ ${item.hours}h</span>
      <span class="goal-deadline">${formatDate(item.createdAt)}</span>
      <button class="todo-delete" data-id="${item.id}">✕</button>
    `;
    ul.appendChild(li);
  });
}

function initStudy() {
  loadStudyPlan();

  const addBtn = $('#study-add');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const subject = $('#study-subject');
      const hours = $('#study-hours');
      const subjVal = subject.value.trim();
      const hoursVal = parseFloat(hours.value);
      if (!subjVal || isNaN(hoursVal) || hoursVal <= 0) {
        alert('请填写科目和有效时长!');
        return;
      }
      const list = Store.get(STUDY_KEY, []);
      list.unshift({ id: uid(), subject: subjVal, hours: hoursVal, createdAt: Date.now() });
      Store.set(STUDY_KEY, list);
      subject.value = '';
      hours.value = '';
      loadStudyPlan();
    });
  }

  const ul = $('#study-list');
  if (ul) {
    ul.addEventListener('click', e => {
      if (e.target.classList.contains('todo-delete')) {
        const id = e.target.dataset.id;
        const list = Store.get(STUDY_KEY, []).filter(x => x.id !== id);
        Store.set(STUDY_KEY, list);
        loadStudyPlan();
      }
    });
  }
}

if (typeof window !== 'undefined') window.initStudy = initStudy;
