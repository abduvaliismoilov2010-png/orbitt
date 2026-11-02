// Vazifalar: qo'shish, belgilash, o'chirish, tanlash
(function () {
  const S = OF.state;
  const form = document.getElementById('taskForm');
  const nameIn = document.getElementById('tName');
  const minIn = document.getElementById('tMin');
  const list = document.getElementById('taskList');
  const chips = document.querySelectorAll('#durChips .chip');

  OF.currentTaskId = S.tasks.find(t => !t.done)?.id || null;

  chips.forEach(c => c.onclick = () => {
    chips.forEach(x => x.classList.remove('active'));
    c.classList.add('active'); minIn.value = c.dataset.m;
  });
  minIn.addEventListener('input', () => chips.forEach(x => x.classList.toggle('active', x.dataset.m === minIn.value)));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameIn.value.trim();
    const min = Math.max(1, Math.min(600, parseInt(minIn.value, 10) || 25));
    if (!name) return;
    const t = { id: OF.uid(), name, min, done: false, spent: 0, created: OF.dayKey() };
    S.tasks.push(t);
    if (!OF.currentTaskId) OF.currentTaskId = t.id;
    nameIn.value = ''; nameIn.focus();
    OF.save();
    OF.toast(`"${name}" qo'shildi — ${OF.minutesToText(min)}`);
  });

  function row(t) {
    const pct = Math.min(100, Math.round((t.spent || 0) / (t.min * 60) * 100));
    return `
      <div class="task ${t.done ? 'done' : ''} ${t.id === OF.currentTaskId ? 'current' : ''}" data-id="${t.id}">
        <div class="check" data-act="done"></div>
        <div class="t-main">
          <div class="t-name">${OF.esc(t.name)}</div>
          <div class="t-meta">${OF.minutesToText(t.min)} · sarflandi ${OF.minutesToText((t.spent || 0) / 60)} · ${pct}%</div>
          <div class="bar" style="margin-top:8px;height:4px"><i style="width:${pct}%"></i></div>
        </div>
        <div class="t-actions">
          <button class="btn small" data-act="focus">Fokus</button>
          <button class="btn small danger" data-act="del">✕</button>
        </div>
      </div>`;
  }

  function render() {
    if (!S.tasks.length) { list.innerHTML = '<div class="empty">Hozircha vazifa yo\'q. Yuqoridan birinchisini qo\'shing ✨</div>'; return; }
    const sorted = [...S.tasks].sort((a, b) => a.done - b.done);
    list.innerHTML = sorted.map(row).join('');
    requestAnimationFrame(() => list.querySelectorAll('.bar > i').forEach(i => { const w = i.style.width; i.style.width = '0'; requestAnimationFrame(() => i.style.width = w); }));
  }

  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const id = btn.closest('.task').dataset.id;
    const t = S.tasks.find(x => x.id === id); if (!t) return;
    const act = btn.dataset.act;
    if (act === 'done') { t.done = !t.done; OF.save(); }
    if (act === 'del') {
      S.tasks = S.tasks.filter(x => x.id !== id);
      if (OF.currentTaskId === id) OF.currentTaskId = S.tasks.find(x => !x.done)?.id || null;
      OF.save();
    }
    if (act === 'focus') { OF.currentTaskId = id; OF.bus.emit('selectTask', id); OF.go('focus'); }
  });

  OF.bus.on('change', render);
  OF.bus.on('selectTask', render);
  render();
})();
