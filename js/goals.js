(function () {
  function sel(selector) {
    return document.querySelector(selector);
  }

  function selAll(selector) {
    return document.querySelectorAll(selector);
  }

  function escapeHtml(str) {
    if (typeof Store !== 'undefined' && typeof Store.escapeHtml === 'function') {
      return Store.escapeHtml(str);
    }
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function getYearGoals() {
    return Store.get(Store.KEYS.YEAR_GOALS) || [];
  }

  function setYearGoals(list) {
    Store.set(Store.KEYS.YEAR_GOALS, list);
  }

  function getShortGoals() {
    return Store.get(Store.KEYS.SHORT_GOALS) || [];
  }

  function setShortGoals(list) {
    Store.set(Store.KEYS.SHORT_GOALS, list);
  }

  function daysRemaining(deadlineStr) {
    if (!deadlineStr) return null;
    var deadline = new Date(deadlineStr + 'T23:59:59');
    var now = new Date();
    var diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function renderYearGoals() {
    var ul = sel('#year-goal-list');
    if (!ul) return;
    ul.innerHTML = '';
    var list = getYearGoals();

    list.forEach(function (item) {
      var li = document.createElement('li');
      li.dataset.id = item.id;

      var text = document.createElement('span');
      text.className = 'goal-text';
      text.textContent = item.text;

      var delBtn = document.createElement('button');
      delBtn.className = 'goal-delete';
      delBtn.textContent = '删除';
      delBtn.addEventListener('click', function () {
        deleteYearGoal(item.id);
      });

      li.appendChild(text);
      li.appendChild(delBtn);
      ul.appendChild(li);
    });
  }

  function renderShortGoals() {
    var ul = sel('#short-goal-list');
    if (!ul) return;
    ul.innerHTML = '';
    var list = getShortGoals();

    var now = Date.now();
    list.forEach(function (item) {
      var li = document.createElement('li');
      li.dataset.id = item.id;

      var text = document.createElement('span');
      text.className = 'goal-text';
      text.textContent = item.text;

      var days = daysRemaining(item.deadline);
      var remain = document.createElement('span');
      remain.className = 'goal-deadline';
      if (days === null) {
        remain.textContent = '';
      } else if (days < 0) {
        remain.textContent = '(已过期 ' + Math.abs(days) + ' 天)';
        remain.classList.add('overdue');
      } else if (days === 0) {
        remain.textContent = '(今天截止)';
      } else {
        remain.textContent = '(剩余 ' + days + ' 天, ' + item.deadline + ')';
      }

      var delBtn = document.createElement('button');
      delBtn.className = 'goal-delete';
      delBtn.textContent = '删除';
      delBtn.addEventListener('click', function () {
        deleteShortGoal(item.id);
      });

      li.appendChild(text);
      li.appendChild(remain);
      li.appendChild(delBtn);
      ul.appendChild(li);
    });
  }

  function renderGoals() {
    renderYearGoals();
    renderShortGoals();
  }

  function addYearGoal() {
    var input = sel('#year-goal-input');
    var text = input.value.trim();
    if (!text) return;
    var list = getYearGoals();
    list.push({
      id: 'yg_' + Date.now(),
      text: text,
      createdAt: Date.now()
    });
    setYearGoals(list);
    input.value = '';
    renderYearGoals();
  }

  function deleteYearGoal(id) {
    var list = getYearGoals().filter(function (x) { return x.id !== id; });
    setYearGoals(list);
    renderYearGoals();
  }

  function addShortGoal() {
    var input = sel('#short-goal-input');
    var deadline = sel('#short-goal-deadline');
    var text = input.value.trim();
    var dl = deadline.value;
    if (!text) return;
    var list = getShortGoals();
    list.push({
      id: 'sg_' + Date.now(),
      text: text,
      deadline: dl || null,
      createdAt: Date.now()
    });
    setShortGoals(list);
    input.value = '';
    if (deadline) deadline.value = '';
    renderShortGoals();
  }

  function deleteShortGoal(id) {
    var list = getShortGoals().filter(function (x) { return x.id !== id; });
    setShortGoals(list);
    renderShortGoals();
  }

  function initGoals() {
    var yearAdd = sel('#year-goal-add');
    if (yearAdd) {
      yearAdd.addEventListener('click', addYearGoal);
    }
    var shortAdd = sel('#short-goal-add');
    if (shortAdd) {
      shortAdd.addEventListener('click', addShortGoal);
    }

    var yearInput = sel('#year-goal-input');
    if (yearInput) {
      yearInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') addYearGoal();
      });
    }
    var shortInput = sel('#short-goal-input');
    if (shortInput) {
      shortInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') addShortGoal();
      });
    }

    renderGoals();
  }

  window.initGoals = initGoals;
  window.renderGoals = renderGoals;
})();
